/* scheduling.c — FCFS, Priority, Round Robin → JSON */
#include "../include/osv.h"

static void gantt_push(Scheduler *s, int pid, int start, int end, const char *label) {
    if (s->gantt_count >= MAX_GANTT) return;
    int i = s->gantt_count++;
    s->gantt[i].pid   = pid;
    s->gantt[i].start = start;
    s->gantt[i].end   = end;
    strncpy(s->gantt[i].label, label, 31);
    s->gantt[i].label[31] = '\0';
}

/* sort by arrival time */
static void sort_by_arrival(Scheduler *s) {
    for (int i = 0; i < s->count - 1; i++)
        for (int j = i + 1; j < s->count; j++)
            if (s->procs[j].arrival < s->procs[i].arrival) {
                SchedProcess tmp = s->procs[i];
                s->procs[i] = s->procs[j];
                s->procs[j] = tmp;
            }
}

static void run_fcfs(Scheduler *s) {
    sort_by_arrival(s);
    int t = 0;
    for (int i = 0; i < s->count; i++) {
        SchedProcess *p = &s->procs[i];
        if (t < p->arrival) t = p->arrival;
        p->waiting    = t - p->arrival;
        gantt_push(s, p->pid, t, t + p->burst, p->label);
        t            += p->burst;
        p->completion = t;
        p->turnaround = t - p->arrival;
    }
}

static void run_priority(Scheduler *s) {
    int done[MAX_PROCESSES] = {0};
    int t = 0, finished = 0;
    while (finished < s->count) {
        int best = -1;
        for (int i = 0; i < s->count; i++) {
            if (done[i]) continue;
            if (s->procs[i].arrival > t) continue;
            if (best == -1 || s->procs[i].priority > s->procs[best].priority)
                best = i;
        }
        if (best == -1) { t++; continue; }
        SchedProcess *p = &s->procs[best];
        done[best] = 1;
        p->waiting    = t - p->arrival;
        gantt_push(s, p->pid, t, t + p->burst, p->label);
        t            += p->burst;
        p->completion = t;
        p->turnaround = t - p->arrival;
        finished++;
    }
}

static void run_rr(Scheduler *s, int quantum) {
    for (int i = 0; i < s->count; i++)
        s->procs[i].remaining = s->procs[i].burst;
    int t = 0, done = 0, pass = 0;
    while (done < s->count && pass < s->count * 400) {
        int any = 0;
        for (int i = 0; i < s->count; i++) {
            SchedProcess *p = &s->procs[i];
            if (p->remaining <= 0 || p->arrival > t) continue;
            int exec = p->remaining < quantum ? p->remaining : quantum;
            gantt_push(s, p->pid, t, t + exec, p->label);
            t             += exec;
            p->remaining  -= exec;
            any = 1;
            if (p->remaining == 0) {
                p->completion = t;
                p->turnaround = t - p->arrival;
                p->waiting    = p->turnaround - p->burst;
                if (p->waiting < 0) p->waiting = 0;
                done++;
            }
        }
        if (!any) t++;
        pass++;
    }
}

/* ─── JSON builder ─────────────────────────────────── */

static void append(char *buf, int size, int *pos, const char *s) {
    int len = (int)strlen(s);
    if (*pos + len < size - 1) {
        memcpy(buf + *pos, s, len);
        *pos += len;
        buf[*pos] = '\0';
    }
}

void handle_scheduling(const char *body, char *out, int out_size) {
    Scheduler s;
    memset(&s, 0, sizeof(s));

    char algo[32] = {0};
    json_get_string(body, "algorithm", algo, 32);
    int quantum = json_get_int(body, "quantum");
    if (quantum < 1) quantum = 2;

    s.count = json_get_process_array(body, s.procs, MAX_PROCESSES);
    if (s.count < 1) {
        snprintf(out, out_size, "{\"error\":\"no processes\"}");
        return;
    }

    if (strcmp(algo, "priority") == 0)
        run_priority(&s);
    else if (strcmp(algo, "rr") == 0)
        run_rr(&s, quantum);
    else
        run_fcfs(&s);

    /* compute averages */
    double sw = 0, st = 0;
    for (int i = 0; i < s.count; i++) {
        sw += s.procs[i].waiting;
        st += s.procs[i].turnaround;
    }
    s.avg_wait = sw / s.count;
    s.avg_tat  = st / s.count;

    /* build JSON */
    int pos = 0;
    char tmp[256];

    append(out, out_size, &pos, "{\"gantt\":[");
    for (int i = 0; i < s.gantt_count; i++) {
        if (i > 0) append(out, out_size, &pos, ",");
        snprintf(tmp, sizeof(tmp),
            "{\"label\":\"%s\",\"pid\":%d,\"start\":%d,\"end\":%d}",
            s.gantt[i].label, s.gantt[i].pid,
            s.gantt[i].start, s.gantt[i].end);
        append(out, out_size, &pos, tmp);
    }
    append(out, out_size, &pos, "],\"processes\":[");
    for (int i = 0; i < s.count; i++) {
        if (i > 0) append(out, out_size, &pos, ",");
        snprintf(tmp, sizeof(tmp),
            "{\"label\":\"%s\",\"arrival\":%d,\"burst\":%d,"
            "\"completion\":%d,\"waiting\":%d,\"turnaround\":%d}",
            s.procs[i].label, s.procs[i].arrival, s.procs[i].burst,
            s.procs[i].completion, s.procs[i].waiting, s.procs[i].turnaround);
        append(out, out_size, &pos, tmp);
    }
    snprintf(tmp, sizeof(tmp),
        "],\"avg_wait\":%.2f,\"avg_tat\":%.2f}", s.avg_wait, s.avg_tat);
    append(out, out_size, &pos, tmp);
}

/* banker.c — Banker's Algorithm → JSON */
#include "../include/osv.h"

static void compute_need(BankerState *b) {
    for (int i = 0; i < b->n; i++)
        for (int j = 0; j < b->m; j++)
            b->need[i][j] = b->max_need[i][j] - b->allocation[i][j];
}

static int banker_safety(BankerState *b) {
    compute_need(b);
    int work[MAX_RESOURCES], finish[MAX_PROCESSES] = {0};
    memcpy(work, b->available, sizeof(int) * b->m);

    int count = 0;
    b->step_count = 0;

    while (count < b->n) {
        int found = 0;
        for (int i = 0; i < b->n; i++) {
            if (finish[i]) continue;
            int can = 1;
            for (int j = 0; j < b->m; j++)
                if (b->need[i][j] > work[j]) { can = 0; break; }
            if (can) {
                /* record step */
                BankerStep *st = &b->steps[b->step_count];
                st->step = b->step_count;
                strncpy(st->process, b->names[i], 31);
                st->process[31] = '\0';
                for (int j = 0; j < b->m; j++) st->work_before[j] = work[j];

                for (int j = 0; j < b->m; j++)
                    work[j] += b->allocation[i][j];

                for (int j = 0; j < b->m; j++) st->work_after[j] = work[j];
                b->step_count++;

                b->safe_seq[count++] = i;
                finish[i] = 1;
                found = 1;
            }
        }
        if (!found) break;
    }
    b->is_safe = (count == b->n);
    return b->is_safe;
}

static void append(char *buf, int size, int *pos, const char *s) {
    int len = (int)strlen(s);
    if (*pos + len < size - 1) {
        memcpy(buf + *pos, s, len);
        *pos += len;
        buf[*pos] = '\0';
    }
}

void handle_banker(const char *body, char *out, int out_size) {
    BankerState b;
    memset(&b, 0, sizeof(b));

    b.n = json_get_int(body, "n");
    b.m = json_get_int(body, "m");
    if (b.n < 1 || b.n > MAX_PROCESSES || b.m < 1 || b.m > MAX_RESOURCES) {
        snprintf(out, out_size, "{\"error\":\"invalid n/m\"}");
        return;
    }

    json_get_int_array(body, "available", b.available, MAX_RESOURCES);
    json_get_array_of_int_arrays(body, "allocation", b.allocation, b.n);
    json_get_array_of_int_arrays(body, "max", b.max_need, b.n);
    json_get_string_array(body, "names", b.names, b.n);

    /* fill default names if not provided */
    for (int i = 0; i < b.n; i++)
        if (b.names[i][0] == '\0')
            snprintf(b.names[i], 32, "P%d", i);

    banker_safety(&b);

    int pos = 0;
    char tmp[512];

    /* need matrix */
    append(out, out_size, &pos, "{\"need\":[");
    for (int i = 0; i < b.n; i++) {
        if (i > 0) append(out, out_size, &pos, ",");
        append(out, out_size, &pos, "[");
        for (int j = 0; j < b.m; j++) {
            if (j > 0) append(out, out_size, &pos, ",");
            snprintf(tmp, sizeof(tmp), "%d", b.need[i][j]);
            append(out, out_size, &pos, tmp);
        }
        append(out, out_size, &pos, "]");
    }
    append(out, out_size, &pos, "],");

    /* is_safe */
    snprintf(tmp, sizeof(tmp), "\"is_safe\":%s,", b.is_safe ? "true" : "false");
    append(out, out_size, &pos, tmp);

    /* safe_seq — only output the processes that were actually sequenced */
    append(out, out_size, &pos, "\"safe_seq\":[");
    int seq_len = b.is_safe ? b.n : b.step_count;
    for (int i = 0; i < seq_len; i++) {
        if (i > 0) append(out, out_size, &pos, ",");
        snprintf(tmp, sizeof(tmp), "\"%s\"", b.names[b.safe_seq[i]]);
        append(out, out_size, &pos, tmp);
    }
    append(out, out_size, &pos, "],");

    /* steps */
    append(out, out_size, &pos, "\"steps\":[");
    for (int i = 0; i < b.step_count; i++) {
        if (i > 0) append(out, out_size, &pos, ",");
        BankerStep *st = &b.steps[i];
        snprintf(tmp, sizeof(tmp),
            "{\"step\":%d,\"process\":\"%s\",\"work_before\":[",
            st->step, st->process);
        append(out, out_size, &pos, tmp);
        for (int j = 0; j < b.m; j++) {
            if (j > 0) append(out, out_size, &pos, ",");
            snprintf(tmp, sizeof(tmp), "%d", st->work_before[j]);
            append(out, out_size, &pos, tmp);
        }
        append(out, out_size, &pos, "],\"work_after\":[");
        for (int j = 0; j < b.m; j++) {
            if (j > 0) append(out, out_size, &pos, ",");
            snprintf(tmp, sizeof(tmp), "%d", st->work_after[j]);
            append(out, out_size, &pos, tmp);
        }
        append(out, out_size, &pos, "]}");
    }
    append(out, out_size, &pos, "]}");
}

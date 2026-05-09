/* memory.c — FIFO and LRU page replacement → JSON */
#include "../include/osv.h"

typedef struct {
    int frames[MAX_FRAMES];
    int num_frames;
    int faults;
    int hits;
    int fifo_ptr;
    int lru_time[MAX_FRAMES];
    int lru_clock;
} PT;

static void pt_init(PT *pt, int nf) {
    pt->num_frames = nf;
    pt->faults = 0; pt->hits = 0;
    pt->fifo_ptr = 0; pt->lru_clock = 0;
    for (int i = 0; i < nf; i++) { pt->frames[i] = -1; pt->lru_time[i] = 0; }
}

static int in_frames(PT *pt, int page) {
    for (int i = 0; i < pt->num_frames; i++)
        if (pt->frames[i] == page) return i;
    return -1;
}

/* Run FIFO and capture steps into result */
static void fifo_run_capture(int nf, int *refs, int len, MemResult *r) {
    PT pt;
    pt_init(&pt, nf);
    r->step_count = 0;
    r->num_frames = nf;

    for (int i = 0; i < len && r->step_count < MAX_STEPS; i++) {
        int pg = refs[i];
        int idx = in_frames(&pt, pg);
        MemStep *st = &r->steps[r->step_count++];
        st->page = pg;
        st->evicted = -1;

        if (idx >= 0) {
            pt.hits++;
            st->fault = 0;
        } else {
            pt.faults++;
            st->fault = 1;
            int empty = -1;
            for (int f = 0; f < pt.num_frames; f++)
                if (pt.frames[f] == -1) { empty = f; break; }
            if (empty >= 0) {
                pt.frames[empty] = pg;
            } else {
                st->evicted = pt.frames[pt.fifo_ptr];
                pt.frames[pt.fifo_ptr] = pg;
                pt.fifo_ptr = (pt.fifo_ptr + 1) % pt.num_frames;
            }
        }
        for (int f = 0; f < nf; f++) st->frames[f] = pt.frames[f];
    }
    r->faults = pt.faults;
    r->hits   = pt.hits;
}

/* Run LRU and capture steps into result */
static void lru_run_capture(int nf, int *refs, int len, MemResult *r) {
    PT pt;
    pt_init(&pt, nf);
    r->step_count = 0;
    r->num_frames = nf;

    for (int i = 0; i < len && r->step_count < MAX_STEPS; i++) {
        int pg = refs[i];
        int idx = in_frames(&pt, pg);
        pt.lru_clock++;
        MemStep *st = &r->steps[r->step_count++];
        st->page = pg;
        st->evicted = -1;

        if (idx >= 0) {
            pt.hits++;
            pt.lru_time[idx] = pt.lru_clock;
            st->fault = 0;
        } else {
            pt.faults++;
            st->fault = 1;
            int empty = -1;
            for (int f = 0; f < pt.num_frames; f++)
                if (pt.frames[f] == -1) { empty = f; break; }
            if (empty >= 0) {
                pt.frames[empty] = pg;
                pt.lru_time[empty] = pt.lru_clock;
            } else {
                int lru = 0;
                for (int f = 1; f < pt.num_frames; f++)
                    if (pt.lru_time[f] < pt.lru_time[lru]) lru = f;
                st->evicted = pt.frames[lru];
                pt.frames[lru] = pg;
                pt.lru_time[lru] = pt.lru_clock;
            }
        }
        for (int f = 0; f < nf; f++) st->frames[f] = pt.frames[f];
    }
    r->faults = pt.faults;
    r->hits   = pt.hits;
}

static void append(char *buf, int size, int *pos, const char *s) {
    int len = (int)strlen(s);
    if (*pos + len < size - 1) {
        memcpy(buf + *pos, s, len);
        *pos += len;
        buf[*pos] = '\0';
    }
}

static void emit_mem_result(char *out, int out_size, int *pos,
                            MemResult *r, int len) {
    char tmp[256];
    double hit_ratio = len > 0 ? (double)r->hits / len : 0.0;

    append(out, out_size, pos, "{\"steps\":[");
    for (int i = 0; i < r->step_count; i++) {
        if (i > 0) append(out, out_size, pos, ",");
        MemStep *st = &r->steps[i];
        snprintf(tmp, sizeof(tmp),
            "{\"page\":%d,\"frames\":[", st->page);
        append(out, out_size, pos, tmp);
        for (int f = 0; f < r->num_frames; f++) {
            if (f > 0) append(out, out_size, pos, ",");
            snprintf(tmp, sizeof(tmp), "%d", st->frames[f]);
            append(out, out_size, pos, tmp);
        }
        snprintf(tmp, sizeof(tmp),
            "],\"fault\":%s,\"evicted\":%d}",
            st->fault ? "true" : "false", st->evicted);
        append(out, out_size, pos, tmp);
    }
    snprintf(tmp, sizeof(tmp),
        "],\"faults\":%d,\"hits\":%d,\"hit_ratio\":%.2f}",
        r->faults, r->hits, hit_ratio);
    append(out, out_size, pos, tmp);
}

void handle_memory(const char *body, char *out, int out_size) {
    int nf  = json_get_int(body, "frames");
    int refs[MAX_PAGES];
    int len = json_get_int_array(body, "references", refs, MAX_PAGES);

    if (nf < 1 || nf > MAX_FRAMES) nf = 3;
    if (len < 1) {
        snprintf(out, out_size, "{\"error\":\"no references\"}");
        return;
    }

    MemResult fifo_r, lru_r;
    memset(&fifo_r, 0, sizeof(fifo_r));
    memset(&lru_r,  0, sizeof(lru_r));

    fifo_run_capture(nf, refs, len, &fifo_r);
    lru_run_capture (nf, refs, len, &lru_r);

    int pos = 0;
    append(out, out_size, &pos, "{\"fifo\":");
    emit_mem_result(out, out_size, &pos, &fifo_r, len);
    append(out, out_size, &pos, ",\"lru\":");
    emit_mem_result(out, out_size, &pos, &lru_r, len);
    append(out, out_size, &pos, "}");
}

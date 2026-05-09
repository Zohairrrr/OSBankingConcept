#ifndef OSV_H
#define OSV_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <math.h>
#include <ctype.h>
#include <pthread.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

/* ─── Limits ─────────────────────────────────────────── */
#define MAX_PROCESSES   10
#define MAX_RESOURCES    5
#define MAX_FRAMES      10
#define MAX_PAGES       64
#define MAX_GANTT       (MAX_PROCESSES * 40)
#define MAX_STEPS       256
#define PORT            8765
#define BUF_SIZE        (1 << 19)   /* 512 KB */
#define BODY_SIZE       (1 << 16)   /* 64 KB  */

/* ─── Scheduling ─────────────────────────────────────── */
typedef struct {
    int  pid;
    char label[32];
    int  priority;
    int  burst;
    int  arrival;
    int  waiting;
    int  turnaround;
    int  completion;
    int  remaining;
} SchedProcess;

typedef struct {
    int  pid;
    char label[32];
    int  start;
    int  end;
} GanttSlice;

typedef struct {
    SchedProcess procs[MAX_PROCESSES];
    int          count;
    GanttSlice   gantt[MAX_GANTT];
    int          gantt_count;
    double       avg_wait;
    double       avg_tat;
} Scheduler;

/* ─── Banker ─────────────────────────────────────────── */
typedef struct {
    int  work_before[MAX_RESOURCES];
    int  work_after[MAX_RESOURCES];
    char process[32];
    int  step;
} BankerStep;

typedef struct {
    int       n, m;
    int       allocation[MAX_PROCESSES][MAX_RESOURCES];
    int       max_need[MAX_PROCESSES][MAX_RESOURCES];
    int       available[MAX_RESOURCES];
    int       need[MAX_PROCESSES][MAX_RESOURCES];
    char      names[MAX_PROCESSES][32];
    int       safe_seq[MAX_PROCESSES];
    int       is_safe;
    BankerStep steps[MAX_PROCESSES];
    int       step_count;
} BankerState;

/* ─── Memory ─────────────────────────────────────────── */
typedef struct {
    int page;
    int frames[MAX_FRAMES];
    int fault;
    int evicted;
} MemStep;

typedef struct {
    MemStep steps[MAX_STEPS];
    int     step_count;
    int     faults;
    int     hits;
    int     num_frames;
} MemResult;

/* ─── IPC ─────────────────────────────────────────────── */
typedef struct {
    int  t;
    char type[8];       /* "send" or "recv" */
    char from[32];
    char to[32];
    char msg[128];
} IPCEvent;

typedef struct {
    IPCEvent events[MAX_STEPS];
    int      event_count;
    char     summary[128];
} IPCResult;

/* ─── JSON helpers ───────────────────────────────────── */
int    json_get_int(const char *json, const char *key);
double json_get_double(const char *json, const char *key);
int    json_get_string(const char *json, const char *key, char *out, int maxlen);
int    json_get_int_array(const char *json, const char *key, int *arr, int maxlen);
int    json_get_array_of_int_arrays(const char *json, const char *key,
                                    int arr[][MAX_RESOURCES], int maxrows);
int    json_get_string_array(const char *json, const char *key,
                             char arr[][32], int maxlen);
int    json_get_process_array(const char *json, SchedProcess *procs, int maxn);

/* ─── Handlers ───────────────────────────────────────── */
void handle_scheduling(const char *body, char *out, int out_size);
void handle_banker    (const char *body, char *out, int out_size);
void handle_memory    (const char *body, char *out, int out_size);
void handle_ipc       (const char *body, char *out, int out_size);

#endif /* OSV_H */

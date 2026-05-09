/* ipc_sim.c — IPC message-passing timeline simulation → JSON */
#include "../include/osv.h"

typedef struct {
    int    client_id;
    char   type[16];   /* "deposit" or "withdraw" */
    double amount;
} Transaction;

static void append(char *buf, int size, int *pos, const char *s) {
    int len = (int)strlen(s);
    if (*pos + len < size - 1) {
        memcpy(buf + *pos, s, len);
        *pos += len;
        buf[*pos] = '\0';
    }
}

/* Parse the transactions array from JSON body:
   "transactions":[{"client_id":1,"type":"deposit","amount":500},...] */
static int parse_transactions(const char *body, Transaction *txs, int maxn) {
    const char *p = strstr(body, "\"transactions\":");
    if (!p) return 0;
    p += strlen("\"transactions\":");
    while (*p == ' ') p++;
    if (*p != '[') return 0;
    p++;
    int count = 0;
    while (*p && *p != ']' && count < maxn) {
        while (*p == ' ' || *p == ',') p++;
        if (*p == ']') break;
        if (*p != '{') { p++; continue; }
        const char *obj_start = p;
        int depth = 1; p++;
        while (*p && depth > 0) {
            if (*p == '{') depth++;
            else if (*p == '}') depth--;
            p++;
        }
        char obj[256];
        int len = (int)(p - obj_start);
        if (len >= (int)sizeof(obj)) len = (int)sizeof(obj) - 1;
        memcpy(obj, obj_start, len);
        obj[len] = '\0';

        txs[count].client_id = json_get_int(obj, "client_id");
        txs[count].amount    = json_get_double(obj, "amount");
        json_get_string(obj, "type", txs[count].type, 16);
        count++;
    }
    return count;
}

void handle_ipc(const char *body, char *out, int out_size) {
    int clients = json_get_int(body, "clients");
    if (clients < 1) clients = 1;
    if (clients > 5) clients = 5;

    Transaction txs[20];
    int ntx = parse_transactions(body, txs, 20);

    IPCResult result;
    memset(&result, 0, sizeof(result));

    /* Simulate timeline:
       Each client sends at t = client_id * 100ms
       Server receives at t + 50ms, replies at t + 150ms
       Client receives reply at t + 200ms */

    double balances[6] = {0};
    for (int i = 1; i <= 5; i++) balances[i] = 1000.00; /* initial balance */

    int t = 0;
    for (int i = 0; i < ntx && result.event_count < MAX_STEPS - 2; i++) {
        Transaction *tx = &txs[i];
        int cid = tx->client_id;
        if (cid < 1 || cid > 5) cid = 1;

        char client_name[32], type_up[16], msg_send[128], msg_recv[128];
        snprintf(client_name, sizeof(client_name), "Client %d", cid);

        /* uppercase type */
        int k = 0;
        while (tx->type[k] && k < 15) {
            type_up[k] = (char)toupper((unsigned char)tx->type[k]);
            k++;
        }
        type_up[k] = '\0';

        snprintf(msg_send, sizeof(msg_send), "%s $%.2f", type_up, tx->amount);

        /* send event */
        IPCEvent *ev = &result.events[result.event_count++];
        ev->t = t;
        memcpy(ev->type, "send\0", 5);
        snprintf(ev->from, sizeof(ev->from), "%s", client_name);
        memcpy(ev->to,  "Server\0", 7);
        snprintf(ev->msg, sizeof(ev->msg), "%s", msg_send);

        /* compute new balance */
        int is_deposit = (strncmp(tx->type, "deposit", 7) == 0);
        double new_bal;
        int ok = 1;
        if (is_deposit) {
            balances[cid] += tx->amount;
            new_bal = balances[cid];
        } else {
            if (balances[cid] >= tx->amount) {
                balances[cid] -= tx->amount;
                new_bal = balances[cid];
            } else {
                ok = 0;
                new_bal = balances[cid];
            }
        }

        if (ok) {
            snprintf(msg_recv, sizeof(msg_recv),
                "OK | Balance: $%.2f", new_bal);
        } else {
            snprintf(msg_recv, sizeof(msg_recv),
                "DENIED: Insufficient funds ($%.2f)", new_bal);
        }

        /* receive event */
        IPCEvent *rv = &result.events[result.event_count++];
        rv->t = t + 150;
        memcpy(rv->type, "recv\0", 5);
        memcpy(rv->from, "Server\0", 7);
        snprintf(rv->to,  sizeof(rv->to),  "%s", client_name);
        snprintf(rv->msg, sizeof(rv->msg), "%s", msg_recv);

        t += 200;
    }

    snprintf(result.summary, sizeof(result.summary),
        "%d transaction%s processed", ntx, ntx == 1 ? "" : "s");

    /* build JSON */
    int pos = 0;
    char tmp[512];

    append(out, out_size, &pos, "{\"events\":[");
    for (int i = 0; i < result.event_count; i++) {
        if (i > 0) append(out, out_size, &pos, ",");
        IPCEvent *ev = &result.events[i];
        snprintf(tmp, sizeof(tmp),
            "{\"t\":%d,\"type\":\"%s\",\"from\":\"%s\",\"to\":\"%s\",\"msg\":\"%s\"}",
            ev->t, ev->type, ev->from, ev->to, ev->msg);
        append(out, out_size, &pos, tmp);
    }
    snprintf(tmp, sizeof(tmp), "],\"summary\":\"%s\"}", result.summary);
    append(out, out_size, &pos, tmp);
}

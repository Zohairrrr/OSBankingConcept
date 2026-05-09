/* main.c — simple socket HTTP server for OSViz, port 8765 */
#include "../include/osv.h"

/* ─── JSON helpers ───────────────────────────────────── */

/* find "key": and return an int value */
int json_get_int(const char *json, const char *key) {
    char pat[64];
    snprintf(pat, sizeof(pat), "\"%s\":", key);
    const char *p = strstr(json, pat);
    if (!p) return 0;
    p += strlen(pat);
    while (*p == ' ') p++;
    return atoi(p);
}

double json_get_double(const char *json, const char *key) {
    char pat[64];
    snprintf(pat, sizeof(pat), "\"%s\":", key);
    const char *p = strstr(json, pat);
    if (!p) return 0.0;
    p += strlen(pat);
    while (*p == ' ') p++;
    return atof(p);
}

int json_get_string(const char *json, const char *key, char *out, int maxlen) {
    char pat[64];
    snprintf(pat, sizeof(pat), "\"%s\":", key);
    const char *p = strstr(json, pat);
    if (!p) { out[0] = '\0'; return 0; }
    p += strlen(pat);
    while (*p == ' ') p++;
    if (*p != '"') { out[0] = '\0'; return 0; }
    p++; /* skip opening " */
    int i = 0;
    while (*p && *p != '"' && i < maxlen - 1)
        out[i++] = *p++;
    out[i] = '\0';
    return i;
}

/* parse "key":[1,2,3] — returns count */
int json_get_int_array(const char *json, const char *key, int *arr, int maxlen) {
    char pat[64];
    snprintf(pat, sizeof(pat), "\"%s\":", key);
    const char *p = strstr(json, pat);
    if (!p) return 0;
    p += strlen(pat);
    while (*p == ' ') p++;
    if (*p != '[') return 0;
    p++; /* skip [ */
    int count = 0;
    while (*p && *p != ']' && count < maxlen) {
        while (*p == ' ' || *p == ',') p++;
        if (*p == ']') break;
        arr[count++] = atoi(p);
        while (*p && *p != ',' && *p != ']') p++;
    }
    return count;
}

/* parse 2-D array like "allocation":[[0,1,0],[2,0,0]] */
int json_get_array_of_int_arrays(const char *json, const char *key,
                                 int arr[][MAX_RESOURCES], int maxrows) {
    char pat[64];
    snprintf(pat, sizeof(pat), "\"%s\":", key);
    const char *p = strstr(json, pat);
    if (!p) return 0;
    p += strlen(pat);
    while (*p == ' ') p++;
    if (*p != '[') return 0;
    p++; /* outer [ */
    int row = 0;
    while (*p && *p != ']' && row < maxrows) {
        while (*p == ' ' || *p == ',') p++;
        if (*p == ']') break;
        if (*p != '[') { p++; continue; }
        p++; /* inner [ */
        int col = 0;
        while (*p && *p != ']' && col < MAX_RESOURCES) {
            while (*p == ' ' || *p == ',') p++;
            if (*p == ']') break;
            arr[row][col++] = atoi(p);
            while (*p && *p != ',' && *p != ']') p++;
        }
        if (*p == ']') p++;
        row++;
    }
    return row;
}

/* parse "names":["P0","P1"] */
int json_get_string_array(const char *json, const char *key,
                          char arr[][32], int maxlen) {
    char pat[64];
    snprintf(pat, sizeof(pat), "\"%s\":", key);
    const char *p = strstr(json, pat);
    if (!p) return 0;
    p += strlen(pat);
    while (*p == ' ') p++;
    if (*p != '[') return 0;
    p++;
    int count = 0;
    while (*p && *p != ']' && count < maxlen) {
        while (*p == ' ' || *p == ',') p++;
        if (*p == ']') break;
        if (*p != '"') { p++; continue; }
        p++;
        int i = 0;
        while (*p && *p != '"' && i < 31)
            arr[count][i++] = *p++;
        arr[count][i] = '\0';
        if (*p == '"') p++;
        count++;
    }
    return count;
}

/* parse processes array:
   "processes":[{"id":0,"label":"P0","arrival":0,"burst":5,"priority":1},...] */
int json_get_process_array(const char *json, SchedProcess *procs, int maxn) {
    const char *p = strstr(json, "\"processes\":");
    if (!p) return 0;
    p += strlen("\"processes\":");
    while (*p == ' ') p++;
    if (*p != '[') return 0;
    p++;
    int count = 0;
    while (*p && *p != ']' && count < maxn) {
        while (*p == ' ' || *p == ',') p++;
        if (*p == ']') break;
        if (*p != '{') { p++; continue; }
        /* find end of this object */
        const char *obj_start = p;
        int depth = 1; p++;
        while (*p && depth > 0) {
            if (*p == '{') depth++;
            else if (*p == '}') depth--;
            p++;
        }
        /* p now points after the closing } */
        char obj[512];
        int len = (int)(p - obj_start);
        if (len >= (int)sizeof(obj)) len = (int)sizeof(obj) - 1;
        memcpy(obj, obj_start, len);
        obj[len] = '\0';

        procs[count].pid      = json_get_int(obj, "id");
        procs[count].priority = json_get_int(obj, "priority");
        procs[count].burst    = json_get_int(obj, "burst");
        procs[count].arrival  = json_get_int(obj, "arrival");
        procs[count].remaining = procs[count].burst;
        json_get_string(obj, "label", procs[count].label, 32);
        if (procs[count].label[0] == '\0')
            snprintf(procs[count].label, 32, "P%d", procs[count].pid);
        count++;
    }
    return count;
}

/* ─── HTTP server ────────────────────────────────────── */

static void send_response(int fd, int status, const char *body) {
    char header[512];
    int blen = (int)strlen(body);
    snprintf(header, sizeof(header),
        "HTTP/1.1 %d OK\r\n"
        "Content-Type: application/json\r\n"
        "Content-Length: %d\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Connection: close\r\n"
        "\r\n",
        status, blen);
    write(fd, header, strlen(header));
    write(fd, body, blen);
}

static void handle_options(int fd) {
    const char *resp =
        "HTTP/1.1 204 No Content\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Connection: close\r\n"
        "\r\n";
    write(fd, resp, strlen(resp));
}

typedef struct {
    int fd;
} ClientArg;

static void *handle_client(void *arg) {
    ClientArg *ca = (ClientArg *)arg;
    int fd = ca->fd;
    free(ca);

    char *rbuf = calloc(1, BUF_SIZE);
    if (!rbuf) { close(fd); return NULL; }

    int total = 0;
    int content_length = 0;

    /* Read headers first */
    while (total < BUF_SIZE - 1) {
        int n = read(fd, rbuf + total, BUF_SIZE - total - 1);
        if (n <= 0) break;
        total += n;
        rbuf[total] = '\0';
        /* Check if we have full headers */
        if (strstr(rbuf, "\r\n\r\n")) break;
    }
    rbuf[total] = '\0';

    /* Parse method and path */
    char method[16] = {0}, path[256] = {0};
    sscanf(rbuf, "%15s %255s", method, path);

    /* OPTIONS preflight */
    if (strcmp(method, "OPTIONS") == 0) {
        handle_options(fd);
        free(rbuf);
        close(fd);
        return NULL;
    }

    /* GET /api/health */
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/health") == 0) {
        send_response(fd, 200, "{\"status\":\"ok\"}");
        free(rbuf);
        close(fd);
        return NULL;
    }

    /* Read body for POST */
    char *body_start = strstr(rbuf, "\r\n\r\n");
    if (body_start) body_start += 4;

    /* Get Content-Length */
    char *cl = strstr(rbuf, "Content-Length:");
    if (!cl) cl = strstr(rbuf, "content-length:");
    if (cl) {
        cl += 15;
        while (*cl == ' ') cl++;
        content_length = atoi(cl);
    }

    /* Read remaining body if needed */
    int header_end = body_start ? (int)(body_start - rbuf) : total;
    int body_so_far = total - header_end;
    while (body_so_far < content_length && total < BUF_SIZE - 1) {
        int n = read(fd, rbuf + total, BUF_SIZE - total - 1);
        if (n <= 0) break;
        total += n;
        rbuf[total] = '\0';
        body_so_far += n;
    }
    body_start = rbuf + header_end;

    char *out = calloc(1, BUF_SIZE);
    if (!out) {
        free(rbuf);
        close(fd);
        return NULL;
    }

    if (strcmp(method, "POST") == 0) {
        if (strcmp(path, "/api/scheduling") == 0) {
            handle_scheduling(body_start, out, BUF_SIZE);
        } else if (strcmp(path, "/api/banker") == 0) {
            handle_banker(body_start, out, BUF_SIZE);
        } else if (strcmp(path, "/api/memory") == 0) {
            handle_memory(body_start, out, BUF_SIZE);
        } else if (strcmp(path, "/api/ipc") == 0) {
            handle_ipc(body_start, out, BUF_SIZE);
        } else {
            snprintf(out, BUF_SIZE, "{\"error\":\"not found\"}");
            send_response(fd, 404, out);
            free(rbuf); free(out); close(fd);
            return NULL;
        }
        send_response(fd, 200, out);
    } else {
        snprintf(out, BUF_SIZE, "{\"error\":\"method not allowed\"}");
        send_response(fd, 405, out);
    }

    free(rbuf);
    free(out);
    close(fd);
    return NULL;
}

int main(void) {
    int srv = socket(AF_INET, SOCK_STREAM, 0);
    if (srv < 0) { perror("socket"); return 1; }

    int opt = 1;
    setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family      = AF_INET;
    addr.sin_port        = htons(PORT);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(srv, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }
    if (listen(srv, 64) < 0) { perror("listen"); return 1; }

    printf("[OSViz] HTTP server listening on port %d\n", PORT);
    fflush(stdout);

    while (1) {
        struct sockaddr_in cli;
        socklen_t cli_len = sizeof(cli);
        int fd = accept(srv, (struct sockaddr *)&cli, &cli_len);
        if (fd < 0) continue;

        ClientArg *ca = malloc(sizeof(ClientArg));
        if (!ca) { close(fd); continue; }
        ca->fd = fd;

        pthread_t tid;
        pthread_attr_t attr;
        pthread_attr_init(&attr);
        pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
        if (pthread_create(&tid, &attr, handle_client, ca) != 0) {
            free(ca); close(fd);
        }
        pthread_attr_destroy(&attr);
    }
    return 0;
}

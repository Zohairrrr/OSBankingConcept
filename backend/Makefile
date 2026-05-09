CC      = gcc
CFLAGS  = -Wall -Wextra -O2 -I./include
SRCS    = src/main.c src/scheduling.c src/banker.c src/memory.c src/ipc_sim.c
TARGET  = backend/osv

.PHONY: all run clean

all:
	$(CC) $(CFLAGS) -o $(TARGET) $(SRCS) -lpthread -lm

run: all
	./$(TARGET)

clean:
	rm -f $(TARGET)

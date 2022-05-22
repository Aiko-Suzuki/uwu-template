# Performance

##### With formatdate helper

| **array size** |      **function**       |    **avg**     |      **min-max**      | **p75**  | **p99**  | **p995** | \*\*\*\* |
| :------------: | :---------------------: | :------------: | :-------------------: | :------: | :------: | :------: | :------: |
|   **[100]**    | renderTemplate built in | 320.81 µs/iter | (305.6 µs … 619.3 µs) | 317.9 µs | 460.1 µs | 480.5 µs |          |
|   **[100]**    |  renderTemplate manual  | 390.6 µs/iter  | (380.4 µs … 648.5 µs) | 387.1 µs |  484 µs  | 503.1 µs |          |
|   **[100]**    |   renderTemplate hbs    | 753.76 µs/iter | (654.5 µs … 3.19 ms)  | 802.1 µs | 1.14 ms  | 1.16 ms  |          |
|   **[500]**    | renderTemplate built in |  1.59 ms/iter  |  (1.53 ms … 2.41 ms)  | 1.58 ms  | 2.11 ms  | 2.15 ms  |          |
|   **[500]**    |  renderTemplate manual  |  1.96 ms/iter  |  (1.92 ms … 3.11 ms)  | 1.96 ms  | 2.17 ms  | 2.24 ms  |          |
|   **[500]**    |   renderTemplate hbs    |  1.4 ms/iter   |  (1.32 ms … 2.37 ms)  |  1.4 ms  | 1.75 ms  | 1.87 ms  |          |
|    **[1k]**    | renderTemplate built in |  3.29 ms/iter  |  (3.07 ms … 6.56 ms)  |  3.2 ms  | 5.48 ms  | 6.56 ms  |          |
|    **[1k]**    |  renderTemplate manual  |  3.97 ms/iter  |  (3.89 ms … 4.44 ms)  | 3.96 ms  | 4.37 ms  | 4.44 ms  |          |
|    **[1k]**    |   renderTemplate hbs    |  2.32 ms/iter  |  (2.17 ms … 4.36 ms)  | 2.37 ms  | 3.93 ms  | 4.12 ms  |          |
|    **[5k]**    | renderTemplate built in | 17.23 ms/iter  | (15.45 ms … 21.59 ms) | 18.38 ms | 21.59 ms | 21.59 ms |          |
|    **[5k]**    |  renderTemplate manual  | 19.56 ms/iter  | (19.23 ms … 23.55 ms) | 19.53 ms | 23.55 ms | 23.55 ms |          |
|    **[5k]**    |   renderTemplate hbs    | 10.87 ms/iter  | (9.04 ms … 14.28 ms)  | 12.2 ms  | 14.28 ms | 14.28 ms |          |
|    **[7k]**    | renderTemplate built in | 28.31 ms/iter  | (23.27 ms … 31.81 ms) | 30.79 ms | 31.81 ms | 31.81 ms |          |
|    **[7k]**    |  renderTemplate manual  | 29.44 ms/iter  | (28.97 ms … 30.12 ms) | 29.64 ms | 30.12 ms | 30.12 ms |          |
|    **[7k]**    |   renderTemplate hbs    | 19.53 ms/iter  | (18.63 ms … 20.96 ms) | 19.83 ms | 20.96 ms | 20.96 ms |          |

##### Without helper

| **array size** |      **function**       |    **avg**     |      **min-max**      | **p75**  | **p99**  | **p995** | \*\*\*\* |
| :------------: | :---------------------: | :------------: | :-------------------: | :------: | :------: | :------: | :------: |
|   **[100]**    | renderTemplate built in | 91.51 µs/iter  | (85.2 µs … 413.7 µs)  | 86.7 µs  | 194.6 µs | 205.6 µs |          |
|   **[100]**    |  renderTemplate manual  | 88.85 µs/iter  | (84.9 µs … 274.8 µs)  | 86.9 µs  | 147.1 µs | 158.6 µs |          |
|   **[100]**    |   renderTemplate hbs    | 638.02 µs/iter | (541.6 µs … 3.09 ms)  | 671.3 µs | 985.6 µs | 1.05 ms  |          |
|   **[500]**    | renderTemplate built in | 448.27 µs/iter | (427.5 µs … 1.01 ms)  | 436.8 µs | 869.9 µs |  898 µs  |          |
|   **[500]**    |  renderTemplate manual  | 445.06 µs/iter | (431.5 µs … 731.6 µs) | 440.2 µs | 555.9 µs | 573.8 µs |          |
|   **[500]**    |   renderTemplate hbs    | 932.64 µs/iter |  (861 µs … 1.38 ms)   |  930 µs  | 1.26 ms  | 1.32 ms  |          |
|    **[1k]**    | renderTemplate built in | 897.9 µs/iter  |   (856 µs … 1.6 ms)   | 868.2 µs |  1.4 ms  | 1.54 ms  |          |
|    **[1k]**    |  renderTemplate manual  | 883.94 µs/iter | (862.9 µs … 1.15 ms)  | 876.4 µs | 1.04 ms  | 1.07 ms  |          |
|    **[1k]**    |   renderTemplate hbs    |  1.35 ms/iter  |  (1.28 ms … 1.73 ms)  | 1.36 ms  | 1.64 ms  | 1.71 ms  |          |
|    **[5k]**    | renderTemplate built in |  5.26 ms/iter  |  (4.29 ms … 8.77 ms)  | 6.73 ms  | 8.72 ms  | 8.77 ms  |          |
|    **[5k]**    |  renderTemplate manual  |  4.45 ms/iter  |   (4.31 ms … 7 ms)    | 4.47 ms  |  6.1 ms  |   7 ms   |          |
|    **[5k]**    |   renderTemplate hbs    |  5.84 ms/iter  | (4.75 ms … 10.52 ms)  | 5.37 ms  | 10.52 ms | 10.52 ms |          |
|    **[7k]**    | renderTemplate built in |  8.66 ms/iter  | (6.47 ms … 11.81 ms)  | 10.59 ms | 11.81 ms | 11.81 ms |          |
|    **[7k]**    |  renderTemplate manual  |  6.72 ms/iter  |  (6.58 ms … 7.03 ms)  | 6.77 ms  | 7.03 ms  | 7.03 ms  |          |
|    **[7k]**    |   renderTemplate hbs    |  9.46 ms/iter  | (7.61 ms … 13.57 ms)  | 11.89 ms | 13.57 ms | 13.57 ms |          |

# Project report sources

`../SwarmFolio_Project_Report.docx` (and `.pdf`) is the BMSCE project report, built to the department's format.

Rebuild, from this folder:

```bash
python ../../experiments/report_experiments.py all --out data   # experiments (about 25 minutes on 4 cores)
python diagrams.py                                              # architecture and flowchart figures
python analyze.py                                               # result figures and facts.json
cd build && node main.js ../SwarmFolio_Project_Report.docx      # build the .docx
cd .. && python pages.py SwarmFolio_Project_Report.docx         # compute TOC page numbers, then run main.js again
```

Run `main.js` and `pages.py` alternately until `pages.json` stops changing. `ui_shots.js` regenerates the interface screenshots against a running `python -m swarmfolio.server --port 8000`.

import subprocess

bash = r"C:\Program Files\Git\bin\bash.exe"

subprocess.run([
    "wt",
    "new-tab",
    bash, "-i", "-c", "cd server && bun run dev",
    ";",
    "split-pane", "-H",
    bash, "-i", "-c", "cd statics && bun run dev",
    ";"
])
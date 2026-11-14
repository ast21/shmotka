"""CHANGELOG.md -> GitHub releases.

python release_notes.py plan
    Prints "version<TAB>sha<TAB>title" for every changelog entry, oldest first.
    The top entry targets $GITHUB_SHA; older ones use .github/release-commits.txt
    (entries without a known commit are skipped).
python release_notes.py notes VERSION
    Prints the release notes for VERSION.
"""
import os
import sys


def entries(path="CHANGELOG.md"):
    out = []
    for line in open(path, encoding="utf-8").read().splitlines():
        if line.startswith("## "):
            parts = [x.strip() for x in line[3:].split("—", 2)] + ["", ""]
            out.append({"version": parts[0], "date": parts[1], "title": parts[2], "tags": [], "items": []})
        elif out and line.startswith("#") and not line.startswith("##"):
            out[-1]["tags"] += [t for t in line.split() if t.startswith("#")]
        elif out and line.startswith("- "):
            out[-1]["items"].append(line[2:].strip())
    return out


def notes(e):
    body = "\n".join(f"- {x}" for x in e["items"])
    if e["tags"]:
        body += "\n\n" + " ".join(f"`{t}`" for t in e["tags"])
    return body


def known_commits(path=".github/release-commits.txt"):
    out = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            parts = line.split()
            if len(parts) == 2 and not line.startswith("#"):
                out[parts[0]] = parts[1]
    return out


if __name__ == "__main__":
    all_entries = entries()
    if sys.argv[1] == "plan":
        commits = known_commits()
        head = os.environ.get("GITHUB_SHA", "HEAD")
        for i, e in enumerate(reversed(all_entries)):
            top = i == len(all_entries) - 1
            sha = commits.get(e["version"]) or (head if top else "")
            if sha:
                print(f"{e['version']}\t{sha}\t{e['version']} — {e['title'] or 'Обновление'}")
    else:
        print(notes(next(x for x in all_entries if x["version"] == sys.argv[2])))

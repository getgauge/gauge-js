import json
import os
import re
import sys
from subprocess import check_output

file_name = "js.json"


def update_version():
    with open(file_name, 'r') as f:
        data = json.load(f)
        new_version = re.sub('\d$', lambda x: str(
            int(x.group(0)) + 1), data["version"])
        data["version"] = new_version

    os.remove(file_name)

    with open(file_name, 'w') as f:
        json.dump(data, f, indent=4)

    return new_version


def update_pom(version):
    c = "npm version {0} --no-git-tag-version"
    check_output(c.format(version), shell=True)


if __name__ == "__main__":
    version = update_version()
    update_pom(version)
    print(version)

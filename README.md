# Lazy Firestore

**Features**

- Export data to files
- Restore exported data back to Firestore
- Update document with data in JSON file
- Clean Firestore - delete all documents. Only support Firebase Emulator
- Print tree of collections and its documents
- View detail of documents

### Table of contents

- [Table of contents](#table-of-contents)
- [Install](#install)
- [Usage](#usage)
- [Setup projects](#setup-projects)
    - [Real project](#real-project)
    - [Firebase Emulator](#firebase-emulator)
- [Sub commands](#sub-commands)
    - [⚡️ dump](#-dump)
    - [⚡️ restore](#-restore)
    - [⚡️ update](#-update)
    - [⚡️ clean](#-clean)
    - [⚡️ tree](#-tree)
    - [⚡️ doc](#-doc)

## Install

Install global:

```shell
npm i -g lazy-firestore
```

## Usage

After install, use cli app named `firestore`

```
firestore/0.1.0

Usage:
  $ firestore <sub-command> [...options] [...sub command arguments]

Commands:
  dump [...name]         Dump Firestore to file
  restore [snapshot]     Restore Firestore from exported data
  update <doc>           Update document with a JSON file
  clean                  Clean Firestore - delete all documents, only use with Emulator's Firestore
  tree [...collections]  Print Firestore structure
  doc [...docs]          Dump Firestore documents

For more info, run any command with the `--help` flag:
  $ firestore dump --help
  $ firestore restore --help
  $ firestore update --help
  $ firestore clean --help
  $ firestore tree --help
  $ firestore doc --help

Options:
  -h, --help     Display this message 
  -v, --version  Display version number 
```

## Setup projects

### Real project

Set environment:

```sh
export GCLOUD_PROJECT=project-name
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service/account/key.json"
```

### Firebase Emulator

Set environment:

```sh
export GCLOUD_PROJECT=project-name
export FIRESTORE_EMULATOR_HOST=localhost:8080 
```

## Sub commands

### ⚡️ dump

Export data to files

```
firestore/0.1.0

Usage:
$ firestore dump [...name]

Options:
--debug        Use debug mode
-h, --help     Display this message
-v, --version  Display version number

Examples:
firestore dump
firestore dump case 1
firestore dump base
```

Examples:

- `firestore dump` => `2021_08_04 09_45_42/`
- `firestore dump case 1` => `2021_08_04 09_45_42 - case 1/`

### ⚡️ restore

Restore exported data back to Firestore:

- If not specified snapshot name, then scan working path to find folders, and select from found items
- Select collections to restore

```
firestore/0.1.0

Usage:
  $ firestore restore [snapshot]

Options:
  --only <collection-name>  Collections to import 
  --dump                    Dump tree of selected snapshot 
  -h, --help                Display this message 
  -v, --version             Display version number 

Examples:
firestore restore
firestore restore "2021_08_04 09_45_42 - case 1"
firestore restore "2021_08_04 09_45_42 - case 1" --only users --only posts
```

### ⚡️ update

Update document with data in a JSON file

```
firestore/0.1.0

Usage:
  $ firestore update <doc>

Options:
  --file <file>           Doc ID, ex: users/user-1 
  --debug                 Use debug mode 
  --path <path>           Update path, ex: tags 
  --mode <merge|replace>  Update mode, accept: merge, replace (default: replace)
  -h, --help              Display this message 
  -v, --version           Display version number 

Examples:
firestore update --doc users/foo --path=city hanoi.json
```

### ⚡️ clean

Clean Firestore - delete all documents. Only support Firebase Emulator

```
firestore/0.1.0

Usage:
  $ firestore clean

Options:
  --debug        Use debug mode 
  -h, --help     Display this message 
  -v, --version  Display version number 

Examples:
firestore clean
```

### ⚡️ tree

Print tree of collections and its documents

```
firestore/0.1.0

Usage:
  $ firestore tree [...collections]

Options:
  --debug        Use debug mode 
  -h, --help     Display this message 
  -v, --version  Display version number 

Examples:
firestore tree
firestore tree news users
```

### ⚡️ doc

View detail of documents

```
firestore/0.1.0

Usage:
  $ firestore doc [...docs]

Options:
  --debug                          Use debug mode 
  --collection <collection-name>   Base collection name 
  --inspect-depth <inspect-depth>  Depth of data to inspect (default: 20)
  -h, --help                       Display this message 
  -v, --version                    Display version number 

Examples:
firestore doc
firestore doc user/1
firestore doc user/1 user/2
firestore doc --collection user 1 2 posts/hello
```

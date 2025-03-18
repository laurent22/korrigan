# Korrigan

Like locate but simpler.

<img src="https://github.com/user-attachments/assets/09a43de2-3374-4a6e-a66c-9da0f002a25d" width="300"/>

## Installation

`npm install -g korrigan`

## Usage

```plaintext
Positionals:
  search-terms  The terms to search for                                 [string]

Options:
  --version           Show version number                              [boolean]
  --update-db         Update the database                              [boolean]
  --show-top-folders  Show folders with the most files                 [boolean]
  --help              Show help                                        [boolean]
```

### Creating the configuration

- Create a file in `$HOME/.config/korrigan/config.json5`
- Set it up to something like this:

```json5
{
	// Folders that should be included in the search:

	includedFolders: [
		'/Users/my-user',
		'/etc',
		'/usr/local',
		'/opt',
		'/var',
	],

	// Folders that should be excluded:
	// (This is a good default setup for macOS)

	excludedFolders: [
		'**/.cache',
		'**/.composer',
		'**/.gem',
		'**/.git',
		'**/.npm',
		'**/.Trash',
		'**/Application Support/**/cache',
		'**/Application Support/**/Cache',
		'**/Developer/Xcode',
		'**/Library/Application Scripts',
		'**/Library/Caches',
		'**/Library/Containers',
		'**/Library/Developer/CoreSimulator',
		'**/Library/Group Containers',
		'**/Library/Logs',
		'**/node_modules',
		'/usr/local/Cellar',
		'/usr/local/lib/python*',
		'/usr/local/lib/ruby',
		'/usr/local/share/man/man3',
		'/var/folders',
	],

	// Files that should be excluded:

	excludedFiles: [
		'.DS_Store'
	],
}
```

### Updating the database

Once this is done, update the database using `korrigan --update-db`. You may want to add this to a cron or other task automator such as [biniou](https://github.com/laurent22/biniou).

This will create the database in `$HOME/.config/korrigan/database.sqlite` which you can check with any SQLite database browser. This may be convenient to view what is being indexed and, in particular, what should be excluded.

### Searching

- Simple search: `korrigan myseach`.

- Search with wildcard: `korrigan '*.zip'`

- Search for multiple terms: `korrigan '*.zip' '*.7z' '*.rar'`

### Inspecting the database

To view a list of folders that contain the most files, use `korrigan --show-top-folders`. This will print the list with the most voluminous folders at the top. This can help to exclude particulary large folders that you may not actually need.

### License

MIT

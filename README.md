# Korrigan

Like locate but simpler.

<img src="https://github.com/user-attachments/assets/09a43de2-3374-4a6e-a66c-9da0f002a25d" width="300"/>

## Installation

`npm install -g korrigan`

## Usage

```plaintext
Positionals:
  search-term  The term to search for                                   [string]

Options:
  --version   Show version number                                      [boolean]
  --updatedb  Update the database                                      [boolean]
  --help      Show help                                                [boolean]
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

Once the database is setup, search for terms using `korrigan myseach`

### License

MIT

#!/usr/bin/env node

import { readdir } from "fs/promises";
import Database, { Database as DatabaseType, Transaction } from 'better-sqlite3';
import { remove } from 'fs-extra';
import { Dirent } from "fs";
import yargs from "yargs";
import { hideBin } from 'yargs/helpers';
import { Config, getDatabasePath, loadConfig } from "./config";

const globToRegExp = require('glob-to-regexp');

const gte = (s:string) => {
	return globToRegExp(s, {globstar: true}) as RegExp;
}

interface FileRow {
	id?: number;
	folder_id?: number;
	name?: string;
}

interface FolderRow {
	id?: number;
	path?: string;
}

let folderId:number = 1;
let saveFileDirTr_:Transaction|null = null;

const saveFiles = (db:DatabaseType, dirPath:string, filenames:string[]) => {
	if (!saveFileDirTr_) {
		const saveDirSt = db.prepare('INSERT INTO folders (id, path) VALUES (?, ?)');
		const saveFileSt = db.prepare('INSERT INTO files (folder_id, name) VALUES (?, ?)');

		saveFileDirTr_ = db.transaction(data => {
			saveDirSt.run(data.folderId, data.dirPath);
			for (const filename of data.filenames) {
				saveFileSt.run(folderId, filename);
			}
		});
	}

	saveFileDirTr_({
		folderId,
		dirPath,
		filenames,
	});

	folderId++;
}

const isDirExcluded = (name:string, exclusions:RegExp[]) => {
	for (const e of exclusions) {
		if (!!name.match(e)) return true;
	}
	return false;
}

const isFileExcluded = (name:string, exclusions:string[]) => {
	for (const e of exclusions) {
		if (name === e) return true;
	}
	return false;
}

const showTopFolders = (db:DatabaseType) => {
	interface Row {
		path: string;
		total : number;
	}

	const rows = db.prepare('SELECT folders.path, count(*) as total FROM files LEFT JOIN folders ON files.folder_id = folders.id GROUP BY folders.id ORDER BY total DESC LIMIT 1000').all() as Row[];
	
	for (const row of rows) {
		console.info(row.total.toString().padEnd(10, ' ') + row.path);
	}
}

interface ProcessDirOptions {
	dirExclusions: RegExp[];
	fileExclusions: string[];
}

const processDir = async (db:DatabaseType, dir:string, options:ProcessDirOptions) => {
	let items:Dirent[] = []; 
	try {
		items = await readdir(dir, { withFileTypes: true });
	} catch (error) {
		if ((error as any).code === 'EACCES') return;
		if ((error as any).code === 'EPERM') return;
		throw error;
	}

	const filenames:string[] = [];

	for (const item of items) {
		if (item.isDirectory()) {
			const fullPath = dir + '/' + item.name;
			if (isDirExcluded(fullPath, options.dirExclusions)) continue;
			await processDir(db, fullPath, options);
		} else {
			if (isFileExcluded(item.name, options.fileExclusions)) continue;
			filenames.push(item.name);
		}
	}

	saveFiles(db, dir, filenames);
}

const updateDatabase = async(config:Config, dbPath:string) => {
	await remove(dbPath);

	const db = new Database(dbPath);

	db.exec(`CREATE TABLE files (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		folder_id INTEGER,
		name TEXT
	);`);

	db.exec('CREATE INDEX files_name ON files (name);');

	db.exec(`CREATE TABLE folders (
		id INTEGER PRIMARY KEY,
		path TEXT
	);`);

	for (const dir of config.includedFolders) {
		await processDir(db, dir, {
			dirExclusions: config.excludedFolders.map(f => gte(f)),
			fileExclusions: config.excludedFiles,
		});
	}
}

const getFoldersByIds = async (db:DatabaseType, ids:number[]) => {
	if (!ids.length) return [];
	const placeholders = ids.map(() => '?').join(', ');
	const stmt = db.prepare(`SELECT * FROM folders WHERE id IN (${placeholders})`);
	return stmt.all(...ids) as FolderRow[];
}

const searchFiles = async (db:DatabaseType, searchTerm:string) => {
	const files = db.prepare("SELECT folder_id, name FROM files WHERE name LIKE ?").all([`%${searchTerm}%`]) as FileRow[];
	const folderIds = [...new Set(files.map(r => r.folder_id as number))];
	const folderRows = await getFoldersByIds(db, folderIds);
	const output:string[] = [];
	for (const file of files) {
		const folder = folderRows.find(r => r.id === file.folder_id);
		if (!folder) throw new Error('Could not find folder for file: ' + JSON.stringify(file));
		output.push(folder.path + '/' + file.name);
	}
	return output;
}

const searchFolders = async (db:DatabaseType, searchTerm:string) => {
	const folders = db.prepare("SELECT path FROM folders WHERE path LIKE ?").all([`%${searchTerm}%`]) as FolderRow[];
	const output:string[] = [];
	for (const folder of folders) {
		output.push(folder.path || '');
	}
	return output;
}

const searchWithGlob = async(db:DatabaseType, searchTerm:string) => {
	if (searchTerm.includes('**')) throw new Error('** is not supported');

	const sqlSearchTerm = searchTerm.replace(/\*/g, '%');

	interface Row {
		full_path: string;
	}

	const rows = db.prepare(`
		SELECT 
			folders.path || '/' || files.name AS full_path
		FROM 
			files
		JOIN 
			folders
		ON 
			files.folder_id = folders.id
		WHERE full_path LIKE ?
	`).all([sqlSearchTerm]) as Row[];

	const output:string[] = [];

	for (const row of rows) {
		output.push(row.full_path);
	}

	return output;
}

const search = async (db:DatabaseType, searchTerms:string[]) => {
	let output:string[] = [];

	for (const searchTerm of searchTerms) {
		if (searchTerm.includes('*')) {
			output = output.concat(await searchWithGlob(db, searchTerm));
		} else {
			const fileResults = await searchFiles(db, searchTerm);
			const folderResults = await searchFolders(db, searchTerm);
			output = output.concat(fileResults.concat(folderResults));
		}
	}

	output.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	
	console.info(output.join('\n'));
}

const main = async (argv:string[]) => {
	interface Args {
		_: string[],
		updateDb: boolean;
		showTopFolders: boolean;
	}

	const args:Args = yargs(hideBin(argv))
		.option('update-db', {
			type: 'boolean',
			description: 'Update the database'
		})
		.option('show-top-folders', {
			type: 'boolean',
			description: 'Show folders with the most files'
		})
		.positional('search-terms', {
			type: 'string',
			demandOption: false,
			array: true,
			description: 'The terms to search for',
		})
		.help()
		.parse() as any;

	const dbPath = await getDatabasePath();
	const config = await loadConfig();
	
	if (args.updateDb) {
		await updateDatabase(config, dbPath);
		return;
	}
	
	const db = new Database(dbPath);

	if (args.showTopFolders) {
		showTopFolders(db);
		return;
	}

	if (!args._[0]) {
		yargs.showHelp();
		return;
	}

	const searchTerms = args._;
	await search(db, searchTerms);
}

main(process.argv).catch(error => {
	console.error(error);
	process.exit(1);
});
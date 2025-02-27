import { mkdirp, pathExists } from "fs-extra";
import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import JSON5 from 'json5'

export const APPNAME = 'korrigan';

export interface Config {
	includedFolders: string[],
	excludedFolders: string[],
	excludedFiles: string[],
}

const defaultConfig = () => {
	const config:Config = {
		includedFolders: [],
		excludedFiles: [],
		excludedFolders: [],
	}

	return config;
}

const getConfigDir = async () => {
	const d = homedir() + '/.config/' + APPNAME;
	await mkdirp(d);
	return d;
}

const getConfigFilePath = async () => {
	return (await getConfigDir()) + '/config.json5';
}

export const getDatabasePath = async () => {
	return (await getConfigDir()) + '/database.sqlite';
}

export const loadConfig = async () => {
	const configFilePath = await getConfigFilePath();

	if (!(await pathExists(configFilePath))) return defaultConfig();

	try {
		const data = await readFile(configFilePath, 'utf-8');
		const parsed = JSON5.parse(data);
		return parsed as Config;
	} catch (error) {
		console.error('Cannot load configuration: ' + configFilePath, error);
		return defaultConfig();
	}
}

export const saveConfig = async (config:Config) => {
	const configFilePath = await getConfigFilePath();

	try {
		await writeFile(configFilePath, JSON5.stringify(config, null, '\t'), 'utf-8');
	} catch (error) {
		console.error('Cannot load configuration: ' + configFilePath, error);
		return defaultConfig();
	}
}
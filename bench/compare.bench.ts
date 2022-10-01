import * as nnt from "../mod.ts";
import handlebars from 'https://cdn.skypack.dev/handlebars';
import * as pug from "https://cdn.esm.sh/v56/pug@3.0.2/deno/pug.bundle.js";
import { generateArray } from "../generate.ts";

const hbs_template = handlebars.compile(Deno.readTextFileSync("bench/template/test.hbs"));
const pug_template = pug.compileFile("bench/template/test.pug");
const nnt_template = nnt.compile(Deno.readTextFileSync("bench/template/test.nnt"));

const data_100 = generateArray(100);

// deno-lint-ignore require-await
Deno.bench("[100] handlebars", { group: "100" }, async () => {
	hbs_template({
		data: data_100,
	});
});

Deno.bench("[100] Pug", { group: "100" }, () => {
	pug_template({
		data: data_100,
	});
});

Deno.bench(
	"[100] uwu-template",
	{
		baseline: true,
		group: "100",
	},
	() => {
		nnt_template(data_100);
	},
);

const data = generateArray(1000);

Deno.bench("[1k] handlebars", { group: "1k" }, async () => {
	hbs_template( {
		data: data,
	});
});

Deno.bench("[1k] Pug", { group: "1k" }, () => {
	pug_template({
		data: data,
	});
});

Deno.bench(
	"[1k] uwu-template",
	{
		baseline: true,
		group: "1k",
	},
	() => {
		nnt_template(data);
	},
);

const data_5 = generateArray(5000);

Deno.bench("[5k] handlebars", { group: "5k" }, async () => {
	hbs_template({
		data: data_5,
	});
});

Deno.bench("[5k] Pug", { group: "5k" }, () => {
	pug_template({
		data: data_5,
	});
});

Deno.bench(
	"[5k] uwu-template",
	{
		baseline: true,
		group: "5k",
	},
	() => {
		nnt_template(data_5);
	},
);

const data_10 = generateArray(10000);

Deno.bench("[10k] handlebars", { group: "10k" }, async () => {
	hbs_template({
		data: data_10,
	});
});

Deno.bench("[10k] Pug", { group: "10k" }, () => {
	pug_template({
		data: data_10,
	});
});

Deno.bench(
	"[10k] uwu-template",
	{
		baseline: true,
		group: "10k",
	},
	() => {
		nnt_template(data_10);
	},
);

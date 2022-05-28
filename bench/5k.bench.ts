import * as nnt from "../mod.ts";
import { Handlebars } from "https://deno.land/x/handlebars@v0.8.0/mod.ts";
import * as pug from "https://cdn.esm.sh/v56/pug@3.0.2/deno/pug.bundle.js";
import {generateArray} from "../generate.ts";

const handle = new Handlebars({
    baseDir: 'bench',
    extname: '.hbs',
    layoutsDir: 'layouts/',
    partialsDir: 'partials/',
    cachePartials: true,
    defaultLayout: 'main',
    compilerOptions: {},
    helpers: {},
});

const hbs_template = "bench/template/test.hbs";
const pug_template = pug.compileFile('bench/template/test.pug');
const nnt_template = nnt.compile(Deno.readTextFileSync("bench/template/test.nnt"));

const data = generateArray(5000);

Deno.bench("[5k] uwu-template",{
    baseline: true,
},() => {
    nnt_template(data);
});

Deno.bench("[5k] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data,
    });
});

Deno.bench("[5k] Pug", () => {
	pug_template({
        data : data
    })
});
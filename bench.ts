// deno-lint-ignore-file require-await
import * as nnt from "./mod.ts";
import { Handlebars } from "https://deno.land/x/handlebars@v0.8.0/mod.ts";
import * as pug from "https://cdn.esm.sh/v56/pug@3.0.2/deno/pug.bundle.js";

// format date to hour:minute yyyy-mm-dd

const formatdate = (date: string) => {
    const d = new Date(date);
    const h = d.getUTCHours(),
        m = d.getUTCMinutes(),
        y = d.getUTCFullYear(),
        M = d.getUTCMonth() + 1,
        D = d.getUTCDate();
    return `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m} ${y}-${M < 10 ? "0" + M : M}-${D < 10 ? "0" + D : D}`;
}

// create instance of Handlebars
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

const template = Deno.readTextFileSync("bench/test.nnt");
const hbs_template = "bench/test.hbs";
const pug_template = pug.compileFile('bench/test.pug');


const nnt_template = nnt.compile(`${template}`,{
    escape : true,
});

interface item {
	title: string;
	slug: string;
	id: number;
	type: string;
	startdate: string;
	visible: string;
}

function generateArray(number:number){
    const data: item[] = [];
    for (let i = 1; i <= number; i++) {
        data.push({
            title: "Test Title &" + i,
            slug: "test-title>" + i,
            id: i,
            type: "post",
            startdate: new Date(new Date().getTime() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 10),
            visible: `${Math.floor(Math.random() * 3) + 1}`,
        });
    }
    return data;
}

const data_100 = generateArray(100);
// 100 benchmark
Deno.bench("[100] uwu-template",() => {
    nnt_template(data_100);
});

Deno.bench("[100] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data_100,
    });
});

Deno.bench("[100] Pug", async () => {
	pug_template({
        data : data_100
    })
});


const data_1k = generateArray(1000);
// 1k benchmark
Deno.bench("[1k] uwu-template", () => {
	nnt_template(data_1k);
});

Deno.bench("[1k] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data_1k,
    });
});

Deno.bench("[1k] Pug", async () => {
	pug_template({
        data : data_1k
    })
});


const data_10k = generateArray(10000);
// 10k benchmark
Deno.bench("[10k] uwu-template", () => {
	nnt_template(data_10k);
});
Deno.bench("[10k] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data_10k,
    });
});
Deno.bench("[10k] Pug", async () => {
	pug_template({
        data : data_10k
    })
});


import * as nnt from "./mod.ts";
import { Handlebars } from "https://deno.land/x/handlebars@v0.8.0/mod.ts";

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
    compilerOptions: undefined,
    helpers: {
        formatdate
    },
});

nnt.registerHelper("formatdate",formatdate);

const template = Deno.readTextFileSync("bench/test.nnt");
const hbs_template = "bench/test.hbs";


const nnt_template = nnt.compile(`${template}`);

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
    for (let i = 0; i < number; i++) {
        data.push({
            title: "Test Title " + i,
            slug: "test-title-" + i,
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
Deno.bench("[100] renderTemplate",() => {
    nnt_template(data_100);
});

Deno.bench("[100] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data_100,
    });
});

const data_500 = generateArray(500);
// 500 benchmark
Deno.bench("[500] renderTemplate", () => {
	nnt_template(data_500);
});

Deno.bench("[500] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data_500,
    });
});

const data_1k = generateArray(1000);
// 1k benchmark
Deno.bench("[1k] renderTemplate", () => {
	nnt_template(data_1k);
});

Deno.bench("[1k] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data_1k,
    });
});

const data_5k = generateArray(5000);
// 5k benchmark
Deno.bench("[5k] renderTemplate", () => {
	nnt_template(data_5k);
});
Deno.bench("[5k] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data_5k,
    });
});


const data_10k = generateArray(10000);
// 10k benchmark
Deno.bench("[10k] renderTemplate", () => {
	nnt_template(data_10k);
});
Deno.bench("[10k] handlebars", async () => {
	await handle.render(hbs_template, {
        data: data_10k,
    });
});
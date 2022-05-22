// deno-lint-ignore-file require-await
import { renderTemplate,compile } from "./mod.ts";
import { Handlebars } from "https://deno.land/x/handlebars@v0.8.0/mod.ts";

// First, create instance of Handlebars

// format date to hour:minute yyyy-mm-dd

const handle = new Handlebars({
    baseDir: 'bench',
    extname: '.hbs',
    layoutsDir: 'layouts/',
    partialsDir: 'partials/',
    cachePartials: true,
    defaultLayout: 'main',
    compilerOptions: undefined,
    helpers: {
        formatdate: (date: string) => {
            const d = new Date(date);
            const h = d.getUTCHours();
            const m = d.getUTCMinutes();
            const y = d.getUTCFullYear();
            const M = d.getUTCMonth() + 1;
            const D = d.getUTCDate();
            return `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m} ${y}-${M < 10 ? "0" + M : M}-${D < 10 ? "0" + D : D}`;
        }
    },
});

const template = Deno.readTextFileSync("bench/test.nnt");
const hbs_template = "bench/test.hbs";

interface item {
	title: string;
	slug: string;
	id: number;
	type: string;
	startdate: string;
	visible: boolean;
}

const data_100: item[] = [];

// randomly fill the data array with item
for (let i = 0; i < 100; i++) {
	data_100.push({
		title: "Test Title " + i,
		slug: "test-title-" + i,
		id: i,
		type: "post",
		startdate: "2020-01-01",
		visible: true,
	});
}

const data_500: item[] = [];

// randomly fill the data array with item
for (let i = 0; i < 500; i++) {
	data_500.push({
		title: "Test Title " + i,
		slug: "test-title-" + i,
		id: i,
		type: "post",
		startdate: "2020-01-01",
		visible: true,
	});
}

const data_1k: item[] = [];

// randomly fill the data array with item
for (let i = 0; i < 1000; i++) {
	data_1k.push({
		title: "Test Title " + i,
		slug: "test-title-" + i,
		id: i,
		type: "post",
		startdate: "2020-01-01",
		visible: true,
	});
}

const data_5k: item[] = [];

// randomly fill the data array with item
for (let i = 0; i < 5000; i++) {
	data_5k.push({
		title: "Test Title " + i,
		slug: "test-title-" + i,
		id: i,
		type: "post",
		startdate: "2020-01-01",
		visible: true,
	});
}

const data_7k: item[] = [];

// randomly fill the data array with item
for (let i = 0; i < 7500; i++) {
	data_7k.push({
		title: "Test Title " + i,
		slug: "test-title-" + i,
		id: i,
		type: "post",
		startdate: "2020-01-01",
		visible: true,
	});
}

const foreachtemplate = compile(`{#foreach this}${template}{/foreach}`);
const compiletemplate = compile(template);



// 100 benchmark
Deno.bench("[100] renderTemplate built in", async () => {
	foreachtemplate(data_100);
});
Deno.bench("[100] renderTemplate manual", async () => {
    data_100.forEach(async (item) => {
        compiletemplate(item);
    });
});
Deno.bench("[100] renderTemplate hbs", async () => {
	await handle.render(hbs_template, {
        data: data_100,
    });
});

// 500 benchmark
Deno.bench("[500] renderTemplate built in", async () => {
	foreachtemplate(data_500);
});
Deno.bench("[500] renderTemplate manual", async () => {
    data_500.forEach(async (item) => {
        compiletemplate(item);
    });
});
Deno.bench("[500] renderTemplate hbs", async () => {
	await handle.render(hbs_template, {
        data: data_500,
    });
});

// 1k benchmark
Deno.bench("[1k] renderTemplate built in", async () => {
	foreachtemplate(data_1k);
});
Deno.bench("[1k] renderTemplate manual", async () => {
    data_1k.forEach(async (item) => {
        compiletemplate(item);
    });
});
Deno.bench("[1k] renderTemplate hbs", async () => {
	await handle.render(hbs_template, {
        data: data_1k,
    });
});

// 5k benchmark
Deno.bench("[5k] renderTemplate built in", async () => {
	foreachtemplate(data_5k);
});
Deno.bench("[5k] renderTemplate manual", async () => {
    data_5k.forEach(async (item) => {
        compiletemplate(item);
    });
});
Deno.bench("[5k] renderTemplate hbs", async () => {
	await handle.render(hbs_template, {
        data: data_5k,
    });
});


// 5k benchmark
Deno.bench("[5k] renderTemplate built in", async () => {
	foreachtemplate(data_5k);
});
Deno.bench("[5k] renderTemplate manual", async () => {
    data_5k.forEach(async (item) => {
        compiletemplate(item);
    });
});
Deno.bench("[5k] renderTemplate hbs", async () => {
	await handle.render(hbs_template, {
        data: data_5k,
    });
});

// 7.5k benchmark
Deno.bench("[7k] renderTemplate built in", async () => {
	foreachtemplate(data_7k);
});
Deno.bench("[7k] renderTemplate manual", async () => {
    data_7k.forEach(async (item) => {
        compiletemplate(item);
    });
});
Deno.bench("[7k] renderTemplate hbs", async () => {
	await handle.render(hbs_template, {
        data: data_7k,
    });
});
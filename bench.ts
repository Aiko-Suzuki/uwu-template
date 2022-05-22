// deno-lint-ignore-file require-await
import { renderTemplate,compile } from "./mod.ts";
import { Handlebars } from "https://deno.land/x/handlebars@v0.8.0/mod.ts";

// First, create instance of Handlebars

const handle = new Handlebars();

const template = Deno.readTextFileSync("test.nnt");
const hbs_template = "test.hbs";

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
// Deno.bench("[100] renderTemplate manual", async () => {
// 	data_100.forEach(async (item) => {
//         await renderTemplate(template, item);
//     });
// });

// Deno.bench("[500] renderTemplate foreach", async () => {
// 	await renderTemplate(foreachtemplate, data_500);
// });
// Deno.bench("[500] renderTemplate hbs", async () => {
// 	await handle.render(hbs_template, {
//         data: data_500,
//     });
// });
// Deno.bench("[500] renderTemplate manual", async () => {
// 	data_500.forEach(async (item) => {
//         await renderTemplate(template, item);
//     });
// });


// Deno.bench("[1k] renderTemplate foreach", async () => {
// 	await renderTemplate(foreachtemplate, data_1k);
// });
// Deno.bench("[1k] renderTemplate hbs", async () => {
// 	await handle.render(hbs_template, {
//         data: data_1k,
//     });
// });
// Deno.bench("[1k] renderTemplate manual", async () => {
// 	data_1k.forEach(async (item) => {
//         await renderTemplate(template, item);
//     });
// });

// Deno.bench("[5k] renderTemplate foreach", async () => {
// 	await renderTemplate(foreachtemplate, data_5k);
// });
// Deno.bench("[5k] renderTemplate hbs", async () => {
// 	await handle.render(hbs_template, {
//         data: data_5k,
//     });
// });
// Deno.bench("[5k] renderTemplate manual", async () => {
// 	data_5k.forEach(async (item) => {
//         await renderTemplate(template, item);
//     });
// });

// Deno.bench("[7.5k] renderTemplate foreach", async () => {
// 	await renderTemplate(foreachtemplate, data_7k);
// });
// Deno.bench("[7.5k] renderTemplate hbs", async () => {
// 	await handle.render(hbs_template, {
//         data: data_7k,
//     });
// });
// Deno.bench("[7.5k] renderTemplate manual", async () => {
// 	data_7k.forEach(async (item) => {
//         await renderTemplate(template, item);
//     });
// });

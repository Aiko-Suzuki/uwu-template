import {compile } from "./mod.ts"

const template_string = `{{#each this}}
<tr id="list_item">
	<td>
		<div class="main__user">
			<div class="main__avatar" style="width:75px;border-radius:0%;">
				<img src="/api/anime/{{id}}/thumb" alt="">
			</div>
			<div class="main__meta">
				<h3>{{JSON title}}</h3>
				<span>ID : {{id}}, SLUG : {{slug}}</span>
			</div>
		</div>
	</td>
	<td>
		<div class="main__table-text main__table-text--rate">7.9</div>
	</td>
	<td>
		<div class="main__table-text">{{type}}</div>
	</td>
	<td>
		<div class="main__table-text">1392</div>
	</td>
	<td id="visible-{{id}}">
		{{#if this.visible == 1}}
			nested if test : {{#if this.visible == true}}{{id}}{{/if}} - {{#if this.visible == true}}{{type}}{{/if}}
			more nested test : {{#if this.visible == true}}{{type}}{{#if this.visible == true}} - {{id}}{{/if}}{{/if}}
		{{#elseif this.visible == 2}}
			<div class="main__table-text main__table-text--green">secret</div>
		{{#else}}
			<div class="main__table-text main__table-text--red">Hidden</div>
		{{/if}}
	</td>
	<td>
		<div class="main__table-text">{{startdate}}</div>
	</td>
	<td>
		<div class="main__table-btns">
			<a href="#" id="toggleVisible-{{id}}" data-visible="{{visible}}" data-action="visible" data-target="/admin/anime/{{id}}" class="main__table-btn main__table-btn--view">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.92,11.6C19.9,6.91,16.1,4,12,4S4.1,6.91,2.08,11.6a1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20s7.9-2.91,9.92-7.6A1,1,0,0,0,21.92,11.6ZM12,18c-3.17,0-6.17-2.29-7.9-6C5.83,8.29,8.83,6,12,6s6.17,2.29,7.9,6C18.17,15.71,15.17,18,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z"/></svg>
			</a>
			<a href="/admin/anime/{{id}}" class="main__table-btn main__table-btn--edit">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5,18H9.24a1,1,0,0,0,.71-.29l6.92-6.93h0L19.71,8a1,1,0,0,0,0-1.42L15.47,2.29a1,1,0,0,0-1.42,0L11.23,5.12h0L4.29,12.05a1,1,0,0,0-.29.71V17A1,1,0,0,0,5,18ZM14.76,4.41l2.83,2.83L16.17,8.66,13.34,5.83ZM6,13.17l5.93-5.93,2.83,2.83L8.83,16H6ZM21,20H3a1,1,0,0,0,0,2H21a1,1,0,0,0,0-2Z"/></svg>
			</a>
			<a href="#modal-delete" data-action="delete" data-value="/api/anime/{{id}}" class="main__table-btn main__table-btn--delete open-modal">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20,6H16V5a3,3,0,0,0-3-3H11A3,3,0,0,0,8,5V6H4A1,1,0,0,0,4,8H5V19a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V8h1a1,1,0,0,0,0-2ZM10,5a1,1,0,0,1,1-1h2a1,1,0,0,1,1,1V6H10Zm7,14a1,1,0,0,1-1,1H8a1,1,0,0,1-1-1V8H17Z"/></svg>
			</a>
		</div>
	</td>
</tr>
{{/each}}`

const template = compile(template_string,{escape: false})

const data = [];

// randomly fill the data array with item
for (let i = 1; i <= 100; i++) {
	data.push({
		title: "Test Title &" + i,
		slug: "test-title>" + i,
		id: i,
		type: "TV",
		startdate: new Date(new Date().getTime() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 10),
        // random asing 1 , 2 or 3
		visible: Math.floor(Math.random() * 3) + 1,
	});
}

const beg = performance.now()
const pef = []
for (let i = 0; i < 100; i++) {
	template(data)
}

console.log("time : " + (performance.now() - beg)  + 'ms')
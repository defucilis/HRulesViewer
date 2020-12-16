window.addEventListener('load', () => fetchJson());





posts = [];
tags = [];
meta = [];
categories = [];



let loadedCount = 0;
const countToLoad = 21;
function fetchJson() {
	for(let i = 0; i < countToLoad; i++) {
		fetch(`./js/json/posts${(i * 100 + 1)}-${(i + 1) * 100}.json`).then(response => response.json()).then(json => addPosts(json));
	}
}

function addPosts(json)
{
	for(let i = 0; i < json.posts.length; i++) {
		let post = new Post(json.posts[i]);
		posts.push(post);

		if(post.tags) {
			for(let j = 0; j < post.tags.length; j++) {
				if(tags.some(item => item.name == post.tags[j])) tags.find(item => item.name == post.tags[j]).count++;
				else tags.push({name:post.tags[j], count:1});
			}
		}

		if(post.categories) {
			for(let j = 0; j < post.categories.length; j++) {
				if(categories.some(item => item.name == post.categories[j])) categories.find(item => item.name == post.categories[j]).count++;
				else categories.push({name:post.categories[j], count:1});
			}
		}

		if(post.meta) {
			for(let j = 0; j < post.meta.length; j++) {
				if(meta.some(item => item.name == post.meta[j])) meta.find(item => item.name == post.meta[j]).count++;
				else meta.push({name:post.meta[j], count:1});
			}
		}

	}

	loadedCount++;
	document.querySelector(".loading h1").innerText = `Loading Post Data (${loadedCount} / ${countToLoad})`

	if(loadedCount == countToLoad) {
		finalizeData();
		createTables();
	}
}

function finalizeData()
{
	//first, remove categories that only have one post since they're all just the title basically
	categories = categories.filter(item => item.count > 1);

	let authorList = [];
	for(let i = 0; i < posts.length; i++) {
		if(!authorList.some(item => item == posts[i].author)) authorList.push(posts[i].author);
	}

	titleAwesomplete.list = authorList;

	let languageList = [];
	for(let i = 0; i < posts.length; i++) {
		if(!languageList.some(item => item == posts[i].language)) {
			if(posts[i].language != "") languageList.push(posts[i].language);
		}
	}
	let select = document.querySelector("#filter-language");
	select.innerHTML = "<option value=\"\"></option>";
	for(let i = 0; i < languageList.length; i++) {
		let option = document.createElement("option");
		option.innerText = languageList[i];
		option.value = languageList[i];
		select.appendChild(option);
	}
}

let postsTable = {};
let tagsTable = {};
let categoriesTable = {};
let metaTable = {};
function createTables()
{
	document.querySelector(".loading").classList.add("hidden");
	document.querySelector(".loaded").classList.remove("hidden");

	postsTable = new Tabulator("#posts", {
		data:posts,
		height: window.innerHeight - 100,
		layout:"fitColumns",
		selectable:1,
		rowSelectionChanged: handlePostSelected,
		dataFiltered:function(filters, rows){
			document.querySelector(".filter-results p").innerText = rows.length > 0
				? "Showing " + rows.length + " Post" + (rows.length == 1 ? "" : "s")
				: "No Posts Pass Filters";
		},
		initialSort:[{column:"dateTime", dir:"desc"}],
		columns:[
			{title:"Title", field:"url", tooltip:true, formatter:"link", formatterParams:{labelField:"title", urlField:"url", target:"_blank"}},
			{title:"Author", field:"author", tooltip: true, width:120},
			{title:"Rating", field:"ratingAverage", formatter: "star", hozAlign: "center", width:80},
			{title:"Date", field:"dateTime", formatter:"datetime", formatterParams:{outputFormat:"DD/MM/YYYY"}, width:80, sorter:"date"},
			// {title:"Categories", field:"categories", tooltip: true, width:80},
			// {title:"Tags", field:"tags", tooltip: true, width:80},
			// {title:"Meta", field:"meta", tooltip: true, width:10},
			// {title:"Pages", field:"pictureCount", width: 60},
			// {title:"Language", field:"language", width: 60},
			// {title:"Color", field:"fullColor", formatter: "tickCross", width: 60},
			// {title:"Complete", field:"complete", formatter: "tickCross", width:60},
			// {title:"Uncens", field:"uncensored", formatter: "tickCross", width:60}
		]
	});

	document.querySelector("#selected-post").style.height = (window.innerHeight - 100) + "px";

	tagsTable = new Tabulator("#tags", {
		data:tags,
		height: 200,
		layout: "fitColumns",
		selectable: true,
		columns: [
			{title:"Tag", field:"name", tooltip: true},
			//{title:"Count", field:"count", width: 80}
		]
	});

	categoriesTable = new Tabulator("#categories", {
		data:categories,
		height: 200,
		layout: "fitColumns",
		selectable: true,
		columns: [
			{title:"Category", field:"name", tooltip: true},
			//{title:"Count", field:"count", width: 80}
		]
	});

	// metaTable = new Tabulator("#meta", {
	// 	data:meta,
	// 	height: 200,
	// 	layout: "fitColumns",
	// 	selectable: true,
	// 	rowSelectionChanged: () => handleSelectionChange(),
	// 	columns: [
	// 		{title:"Name", field:"name", tooltip: true},
	// 		//{title:"Count", field:"count", width: 80}
	// 	]
	// });
}

function handlePostSelected(data, rows) {
	if(!data || data.length == 0) return;
	let post = getPostByTitle(data[0].title);
	document.querySelector("#post-details-title").innerText = post.title;
	document.querySelector("#post-details-rating").innerText = post.getRatingStars();
	document.querySelector("#post-details-author").innerText = "by " + post.author;
	document.querySelector("#post-details-date").innerText = post.dateTime.format("DD/MM/YYYY");
	document.querySelector("#post-details-categories").innerText = post.getCategoryList();
	document.querySelector("#post-details-image").src = post.previewUrl;
	document.querySelector("#post-details-picture-count").innerText = post.pictureCount > 0 ? post.pictureCount : "unknown";
	document.querySelector("#post-details-language").innerText = post.language || "unknown";
	document.querySelector("#post-details-full-color").checked = post.fullColor;
	document.querySelector("#post-details-uncensored").checked = post.uncensored;
	document.querySelector("#post-details-complete").checked = post.complete;
	document.querySelector("#post-details-retouched").checked = post.retouched;
	post.addTagListItems(document.querySelector("#post-details-tags"));
	document.querySelector(".post-details-open-container a").href = post.url;

	nav_selectedPost();
}

let filterDom = {};
let filterParams = {};
let filterNames = [];
function getFilterDom() {
	filterDom.hasDom = true;

	filterDom.title = document.querySelector("#filter-title");
	filterDom.author = document.querySelector("#filter-author");
	filterDom.ratingMin = document.querySelector("#filter-rating-min");
	filterDom.ratingMax = document.querySelector("#filter-rating-max");
	filterDom.dateMin = document.querySelector("#filter-date-min");
	filterDom.dateMax = document.querySelector("#filter-date-max");
	filterDom.pictureCountMin = document.querySelector("#filter-picture-count-min");
	filterDom.pictureCountMax = document.querySelector("#filter-picture-count-max");
	filterDom.language = document.querySelector("#filter-language");
	filterDom.fullColor = document.querySelector("#filter-full-color");
	filterDom.uncensored = document.querySelector("#filter-uncensored");
	filterDom.complete = document.querySelector("#filter-complete");
	filterDom.retouched = document.querySelector("#filter-retouched");

	filterParams.title = {active: false, value:undefined};
	filterParams.timeMin = {active: false, value:undefined};
	filterParams.timeMax = {active: false, value:undefined};
	filterParams.author = {active: false, value:undefined};
	filterParams.ratingMin = {active: false, value:undefined};
	filterParams.ratingMax = {active: false, value:undefined};
	filterParams.pictureCountMin = {active: false, value:undefined};
	filterParams.pictureCountMax = {active: false, value:undefined};
	filterParams.language = {active: false, value:undefined};
	filterParams.fullColor = {active: false, value:undefined};
	filterParams.complete = {active: false, value:undefined};
	filterParams.uncensored = {active: false, value:undefined};
	filterParams.retouched = {active: false, value:undefined};
	filterParams.tag = {active: false, value: undefined};
	filterParams.category = {active: false, value: undefined};
	filterParams.meta = {active: false, value: undefined};

	filterNames = [
		"title",
		"timeMin",
		"timeMax",
		"author",
		"ratingMin",
		"ratingMax",
		"pictureCountMin",
		"pictureCountMax",
		"language",
		"fullColor",
		"complete",
		"uncensored",
		"retouched",
		"tag",
		"category",
		"meta"
	];
}

function applyFilters() {
	postsTable.clearFilter();
	
	if(!filterDom.hasDom) getFilterDom();

	let selectedTags = tagsTable.getSelectedData();
	let selectedCategories = categoriesTable.getSelectedData();
	//let selectedMeta = metaTable.getSelectedData();

	filterParams.tag.value = [];
	filterParams.category.value = [];
	filterParams.meta.value = [];

	selectedTags.forEach(item => filterParams.tag.value.push(item.name));
	selectedCategories.forEach(item => filterParams.category.value.push(item.name));
	//selectedMeta.forEach(item => metaFilter.value.push(item.name));

	filterParams.tag.active = filterParams.tag.value.length > 0;
	filterParams.category.active = filterParams.category.value.length > 0;
	filterParams.meta.active = filterParams.meta.value.length > 0;

	filterParams.title.value = filterDom.title.value;
	filterParams.timeMin.value = moment(filterDom.dateMin.value, "YYYY/MM/DD").toDate();
	filterParams.timeMax.value = moment(filterDom.dateMax.value, "YYYY/MM/DD").toDate();
	filterParams.author.value = filterDom.author.value;
	filterParams.ratingMin.value = filterDom.ratingMin.value;
	filterParams.ratingMax.value = filterDom.ratingMax.value;
	filterParams.pictureCountMin.value = filterDom.pictureCountMin.value;
	filterParams.pictureCountMax.value = filterDom.pictureCountMax.value;
	filterParams.language.value = filterDom.language.value;
	filterParams.fullColor.value = filterDom.fullColor.checked;
	filterParams.complete.value = filterDom.complete.checked;
	filterParams.uncensored.value = filterDom.uncensored.checked;
	filterParams.retouched.value = filterDom.retouched.checked;

	filterParams.title.active = filterDom.title.value != "";
	filterParams.timeMin.active = filterDom.dateMin.value != "";
	filterParams.timeMax.active = filterDom.dateMax.value != "";
	filterParams.author.active = filterDom.author.value != "";
	filterParams.ratingMin.active = filterDom.ratingMin.value != "";
	filterParams.ratingMax.active = filterDom.ratingMax.value != "";
	filterParams.pictureCountMin.active = filterDom.pictureCountMin.value != "";
	filterParams.pictureCountMax.active = filterDom.pictureCountMax.value != "";
	filterParams.language.active = filterDom.language.value != "";
	filterParams.fullColor.active = filterDom.fullColor.checked;
	filterParams.complete.active = filterDom.complete.checked;
	filterParams.uncensored.active = filterDom.uncensored.checked;
	filterParams.retouched.active = filterDom.retouched.checked;

	let activeCount = 0;
	for(let i = 0; i < filterNames.length; i++) {
		if(filterParams[filterNames[i]].active) activeCount++;
	}
	document.querySelector("#filters-button").innerText = `Filters${activeCount > 0 ? " (" + activeCount + ")" : ""}`;

	postsTable.setFilter(customFilter, filterParams);
}

function clearFilters() {
	postsTable.clearFilter();

	if(!filterDom.hasDom) getFilterDom();

	tagsTable.deselectRow();
	categoriesTable.deselectRow();
	filterDom.title.value = "";
	filterDom.author.value = "";
	filterDom.ratingMin.value = "";
	filterDom.ratingMax.value = "";
	filterDom.dateMin.value = "";
	filterDom.dateMax.value = "";
	filterDom.pictureCountMin.value = "";
	filterDom.pictureCountMax.value = "";
	filterDom.language.value = "";
	filterDom.fullColor.checked = false;
	filterDom.uncensored.checked = false;
	filterDom.complete.checked = false;
	filterDom.retouched.checked = false;

	filterParams.title.active = false;
	filterParams.timeMin.active = false;
	filterParams.timeMax.active = false;
	filterParams.author.active = false;
	filterParams.ratingMin.active = false;
	filterParams.ratingMax.active = false;
	filterParams.pictureCountMin.active = false;
	filterParams.pictureCountMax.active = false;
	filterParams.language.active = false;
	filterParams.fullColor.active = false;
	filterParams.complete.active = false;
	filterParams.uncensored.active = false;
	filterParams.retouched.active = false;
	filterParams.tag.active = false;
	filterParams.category.active = false;
	filterParams.meta.active = false;
}

function customFilter(data, filterParams) {
	let success = true;

	data = getPostByTitle(data.title);

	//Title
	success = success && (
		!filterParams.title.active 
		|| (data.title !== undefined && data.title.toLowerCase().includes(filterParams.title.value)));
	if(!success) return false;

	//Author
	success = success && (
		!filterParams.author.active
		|| (data.author && data.author.toLowerCase().trim() == filterParams.author.value.toLowerCase().trim()));
	if(!success) return false;

	//Tags, Categories, Meta
	success = success && (
		!filterParams.tag.active 
		|| (data.tags && data.tags.length > 0 && filterParams.tag.value.every(item => data.tag.includes(item))));
	if(!success) return false;

	success = success && (
		!filterParams.category.active 
		|| (data.categories && data.categories.length > 0 && filterParams.category.value.every(item => data.categories.includes(item))));
	if(!success) return false;

	success = success && (
		!filterParams.meta.active 
		|| (data.meta && data.meta.length > 0 && filterParams.meta.value.every(item => data.meta.includes(item))));
	if(!success) return false;

	//Time
	success = success && (
		!filterParams.timeMin.active
		|| data.timestamp > filterParams.timeMin.value);
	if(!success) return false;

	success = success && (
		!filterParams.timeMax.active
		|| data.timestamp < filterParams.timeMax.value);
	if(!success) return false;

	//Picture Count
	success = success && (
		!filterParams.pictureCountMin.active
		|| (data.pictureCount && data.pictureCount > 0 && data.pictureCount > filterParams.pictureCountMin.value));
	if(!success) return false;

	success = success && (
		!filterParams.pictureCountMax.active
		|| (data.pictureCount && data.pictureCount > 0 && data.pictureCount < filterParams.pictureCountMax.value));
	if(!success) return false;

	//Rating
	success = success && (
		!filterParams.ratingMin.active
		|| (data.ratingAverage && (data.ratingAverage > filterParams.ratingMin.value)));
	if(!success) return false;

	success = success && (
		!filterParams.ratingMax.active
		|| (data.ratingAverage && (data.ratingAverage < filterParams.ratingMax.value)));
	if(!success) return false;

	//Language
	success = success && (
		!filterParams.language.active
		|| (data.language && data.language != "" && data.language == filterParams.language.value));
	if(!success) return false;

	//Boolean values (fullcolor, uncensored, complete, retouched)
	success = success && (
		!filterParams.fullColor.active
		|| data.fullColor == true);
	if(!success) return false;

	success = success && (
		!filterParams.complete.active
		|| data.complete == true);
	if(!success) return false;

	success = success && (
		!filterParams.uncensored.active
		|| data.uncensored == true);
	if(!success) return false;

	success = success && (
		!filterParams.retouched.active
		|| data.retouched == true);
	if(!success) return false;

	return true;
}

let showingFilters = false;
let filtersToggle;
let filtersContent;
function toggleFilters() {
	if(!filtersToggle) {
		filtersToggle = document.querySelector(".filtersToggle");
		filtersContent = document.querySelector(".filters");
	}

	if(showingFilters) {
		filtersContent.classList.add("hidden");
		filtersToggle.innerText = "Filters >";
		showingFilters = false;
	} else {
		filtersContent.classList.remove("hidden");
		filtersToggle.innerText = "Filters V";
		showingFilters = true;
	}
}

hasTitlesToPosts = false;
titlesToPosts = {};
function getPostByTitle(title) {
	if(!hasTitlesToPosts) {
		for(let i = 0; i < posts.length; i++) {
			titlesToPosts[posts[i].title] = i;
		}
		hasTitlesToPosts = true;
	}

	return posts[titlesToPosts[title]];
}

function nav_filters() {
	document.querySelector("#filters").classList.remove("hidden");
	document.querySelector("#selected-post").classList.add("hidden");
	document.querySelector("#about").classList.add("hidden");
}

function nav_about() {
	document.querySelector("#filters").classList.add("hidden");
	document.querySelector("#selected-post").classList.add("hidden");
	document.querySelector("#about").classList.remove("hidden");
}

function nav_selectedPost() {
	document.querySelector("#filters").classList.add("hidden");
	document.querySelector("#selected-post").classList.remove("hidden");
	document.querySelector("#about").classList.add("hidden");
}



















class Post {
	title = "";
	url = "";
	timestamp = "";
	dateTime = {};
	dateTimeString = "";
	author = "";
	meta = [];
	previewUrl = "";
	categories = [];
	tags = [];
	ratingCount = 0;
	ratingAverage = 0;

	//not all posts have this information
	pictureCount = -1;
	language = "";
	fullColor = false;
	complete = false;
	uncensored = false;
	retouched = false;

	constructor(rawObject) {
		this.title = rawObject.title;
		this.url = rawObject.url;
		this.dateTime = moment(rawObject.timestamp);
		this.timestamp = this.dateTime.toDate();
		this.author = rawObject.author;
		this.meta = rawObject.meta || [];
		this.previewUrl = rawObject.previewUrl;
		this.categories = rawObject.categories || [];
		this.tags = rawObject.tags || [];
		this.ratingCount = rawObject.rating.voteCount;
		this.ratingAverage = rawObject.rating.voteAverage;

		this.parseMeta();
	}

	parseMeta() {
		if(!this.meta) return;

		//check for a meta with the word 'pictures' and put that in the pictureCount field
		for(let i = 0; i < this.meta.length; i++) {
			if(this.meta[i].toLowerCase().includes("pictur") || this.meta[i].toLowerCase().includes("pages")) {
				this.pictureCount = Number(this.meta[i].split(" ")[0]);
			}
		}

		if(this.meta.some(item => item.toLowerCase().includes("uncensor"))) this.uncensored = true;

		if(this.meta.some(item => item.toLowerCase().includes("english"))) this.language = "english";
		if(this.meta.some(item => item.toLowerCase().includes("jap"))) {
			if(this.language == "english") this.language = "mixed";
			else this.language = "japanese";
		}
		if(this.meta.some(item => item.toLowerCase().includes("complete"))) this.complete = true;
		if(this.meta.some(item => item.toLowerCase().includes("color") || item.toLowerCase().includes("colour"))) this.fullColor = true;
		if(this.meta.some(item => item.toLowerCase().includes("retouch"))) this.retouched = true;
		
		this.meta = this.meta.filter(item => !(item.toLowerCase().includes("pictures") || item.toLowerCase().includes("pages")));
		this.meta = this.meta.filter(item => !item.toLowerCase().includes("english"));
		this.meta = this.meta.filter(item => !item.toLowerCase().includes("jap"));
		this.meta = this.meta.filter(item => !item.toLowerCase().includes("complete"));
		this.meta = this.meta.filter(item => !item.toLowerCase().includes("uncensor"));
		this.meta = this.meta.filter(item => !item.toLowerCase().includes("retouch"));
		this.meta = this.meta.filter(item => !(item.toLowerCase().includes("color") || item.toLowerCase().includes("colour")));
	}

	getRatingStars() {
		let output = "";
		for(let i = 0.5; i <= 4.5; i++) {
			if(i < this.ratingAverage) output += "★";
			else output += "☆";
		}
		output += " (" + this.ratingCount + ")";
		return output;
	}

	getCategoryList() {
		if(!this.categories || this.categories.length == 0) return "none";
		let output = "";
		for(let i = 0; i < this.categories.length; i++) {
			if(i > 0) output += ", ";
			output += this.categories[i];
		}
		return output;
	}

	addTagListItems(parent) {
		parent.innerHTML = "";
		if(!this.tags || this.tags.length == 0) return;
		for(let i = 0; i < this.tags.length; i++) {
			let item = document.createElement("li");
			item.innerText = this.tags[i];
			parent.appendChild(item);
		}
	}
}
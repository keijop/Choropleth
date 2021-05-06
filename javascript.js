
let svg = d3.select('#viz')
			.append('svg')

//global variables			
let colorScale = d3.scaleQuantize()
					.range(d3.schemeGreens[9])	

let legendScaleX = d3.scaleLinear()
						
let legendAxisX = svg.append('g')
					.attr('id', 'legend')
					
let projection = d3.geoIdentity()
					.reflectY(true)

//fetch data 																	
Promise.all([
	fetch('https://raw.githubusercontent.com/keijop/counties_geojson/main/olkyl-mo4et.json?token=ASHBDHDT2DYLTYXWUREE2UTASQZL4'),
	fetch('https://raw.githubusercontent.com/keijop/counties_geojson/main/maakond_20210301.json?token=ASHBDHEFLCLHCGOPYWV37L3ASQZIQ')
	])
	.then(responses => Promise.all(responses.map(response => response.json())))
	.then(data => {
		
		let geoData = data[0]
		let statData = data[1]
		console.log(statData)
		console.log(geoData)

		//set total ('Kokku' in estonian) for the domain for colorScale
		colorScale.domain(d3.extent(statData.map(obj => Number(obj.Kokku))))

		legendScaleX.domain(colorScale.domain())
		
		svg.selectAll('path')
			.data(geoData.features)
			.enter()
			.append('path')
			.attr('d', d3.geoPath().projection(projection))
			.attr('data-county', d => d.properties.MNIMI)
			.attr('data-ehak', d => d.properties.MKOOD)
			.attr('id', d => d.properties.MKOOD)
			.attr('data-total', d => {
				return addAttribute(d, 'Kokku', statData)
			})

			.attr('data-wind', d =>{
				return addAttribute(d, 'TuuleheideTuulemurd',statData)
			})

			.attr('data-fire', d => { 
				return addAttribute(d, 'Metsatulekahjud',statData)
			})

			.attr('data-decease', d => { 
				return addAttribute(d, 'Metsahaigused',statData)
			})

			.attr('data-animal', d => { 
				return addAttribute(d, 'Metsloomakahjustused',statData)
			})

			.attr('data-bugs', d => { 
				return addAttribute(d, 'Putukakahjustused',statData)
			})

			.attr('data-other', d => { 
				return addAttribute(d, 'Muudkahjustused',statData)
			})

			.attr('data-water', d => { 
				return addAttribute(d, 'Ebasoodneveerziim',statData)
			})

			// !!! arrow function doesn't support 'this' keyword
			.style('fill', function () {
				return colorScale(this.getAttribute('data-total'))
				})

			//mouse functions
			.on('mouseover', (e,d) =>{

				console.log(e.target)
				
				d3.select('#info-box')
					.style('opacity', 1)
				
				d3.select('#info')
					.html(` 
						<b>${e.target.getAttribute('data-county')}</b><br>
						Kogu häving: ${e.target.getAttribute('data-total')} ha<br>
						Tuuleheide ja -murd: ${e.target.getAttribute('data-wind')} ha<br>
						Putukakahjustused: ${e.target.getAttribute('data-bugs')} ha<br>
						Metsloomakahjustused: ${e.target.getAttribute('data-animal')} ha<br>
						Metsahaigused: ${e.target.getAttribute('data-decease')} ha<br>
						Metsatulekahjud: ${e.target.getAttribute('data-fire')} ha<br>
						Ebasoodne veerežiim: ${e.target.getAttribute('data-water')} ha<br>
						Muud kahjustused: ${e.target.getAttribute('data-other')} ha<br>	
						`)
					})

			.on('mouseout', (e,d) => {
					d3.select('#info-box')
						.style('opacity', 0)
					})

			//legend
			svg.append('text')
				.attr('id', 'text')
				.text('Häving hektarites')

			//data - for each colorScale color an array of  [color start, color stop]
			legendAxisX.selectAll('rect')
						.data(colorScale.range().map(d => colorScale.invertExtent(d)))
							.enter()
						.append('rect')

			//for responsivness
			//calculate svg dimension and render all elements on svg accordingly 
			renderMap()
			
			function renderMap(){

			let width = document.getElementById('viz').clientWidth
			let height = width/1.8;

			svg.attr('height', height)
				.attr('width', width)

			let newProjection = d3.geoIdentity()
									.reflectY(true)
									.fitSize([width, height], geoData)

			svg.selectAll("path").attr('d', d3.geoPath().projection(newProjection))

			d3.select('#text').attr('transform', `translate(${width/2.5 + 10}, ${width/1.81})`)

			legendScaleX.range([0, `${width/4}`])

			legendAxisX.attr('transform', `translate(${width/2.5 - 40}, ${width/1.8 - 40})`)

			//calculate rect x and width using inverExtent [color start, color stop]
			legendAxisX.selectAll('rect')
						.attr('x', d => legendScaleX(d[0]))
    					.attr('y', '-10')
						.attr('width', d => legendScaleX(d[1]) - legendScaleX(d[0]) )
						.attr('height', '10')
						.attr('fill', d => colorScale(d[0]))


			legendAxisX.call(d3.axisBottom(legendScaleX)
			//calculate tick values between legendscale domain min and max values for colorscale 9 colors  
									.tickValues(d3.range(legendScaleX.domain()[0], legendScaleX.domain()[1], (legendScaleX.domain()[1]-legendScaleX.domain()[0])/9))
									)
			};

			window.addEventListener('resize', renderMap)
	});

	//helper func to add attributes using both databases (geoData and statData)
	function addAttribute (d, prop,statData) {

			let match = statData.filter(obj => {
					return '00' + obj.EHAK === d.properties.MKOOD
				})
				if (match[0][prop] === '..'){
					return 0
				}else

			return match[0][prop]
	};

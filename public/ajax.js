$(function() {
	const API_ROOT = '/films';
	let postModal = $('#postModal');
	let putModal = $('#putModal');
	let notiModal = $('#notiModal');

	let filmsCached;

	getDataAndRender();

/*
POST - Create new
*/
	// Button clicked, show Modal
	$('h3').on('click', function() {
		postModal.show();
		postModal.find('#genre').focus();
	});

	// On submit, send request
	$('#postModal form').on('submit', function(event) {
		event.preventDefault();
		let thisModal = $(this);

		$.ajax({
			url: API_ROOT,
			type: 'POST',
			dataType: 'json',
			data: {
				genre: $(this).find('#genre').val().toLowerCase(),
				title: $(this).find('#title').val().toLowerCase(),
				duration: $(this).find('#duration').val(),
				date: $(this).find('#date').val()
			}
		})
		.done(function() {
			console.log("success");

			// Clear old data, hide modal
			postModal.hide();

			// Re-fetch data
			getDataAndRender();

			// Clear last input
			$('#postModal input[type="text"]').val("");

			// Clear search input
			$('input[type="search"]').val('');

			// Sort về ban đầu
			$('th:not(.unsortable)').attr('class', 'normal');
		})
		.fail(function() {
			console.log("error");
			alert('Unable to create a new movie. Server may be down temporarily.');
		})
		.always(function() {
			console.log("complete");
		});
	});


/*
PUT - edit movie
*/

	// EDIT clicked, show Modal with filled data
	function editEvent() {
		let td_Siblings = $(this).parent().siblings();

		// Import data into modal
		putModal.find('legend').attr('data-id', $(this).data('id'));
		putModal.find('#genre').val(td_Siblings[1].textContent);
		putModal.find('#title').val(td_Siblings[2].textContent);
		putModal.find('#duration').val(td_Siblings[3].textContent);
		putModal.find('#date').val(td_Siblings[4].textContent);

		// Show modal
		putModal.show();
		putModal.find('#genre').select();	
	}

	// On submit, send request
	$('#putModal form').on('submit', function(event) {
		event.preventDefault();
		let id = $(this).find('legend')[0].getAttribute('data-id');
		let genre = $(this).find('#genre').val();
		let title = $(this).find('#title').val();
		let duration = $(this).find('#duration').val();
		let date = $(this).find('#date').val();
		// console.log($(this).find('legend')[0].getAttribute('data-id'))

		$.ajax({
			url: API_ROOT + '/' + id,
			type: 'PUT',
			dataType: 'json',
			data: {
				"genre": genre,
				"title": title,
				"duration": duration,
				"date": date
			}
		})
		.done(function() {
			console.log("success");

			// Hide modal
			putModal.hide();

			// Re-fetch data
			$(`tr[data-id=${id}] td`).eq(1).text(genre);
			$(`tr[data-id=${id}] td`).eq(2).text(title);
			$(`tr[data-id=${id}] td`).eq(3).text(duration);
			$(`tr[data-id=${id}] td`).eq(4).text(date);
		})
		.fail(function() {
			console.log("error");
			alert('Unable to edit this movie. Server may be down temporarily.')
		})
		.always(function() {
			console.log("complete");
		});
		
	});

/*
DELETE function
*/

	// DELETE clicked
	$('#delete-selected').on('click', function() {
		let ids = [];
		let trs_checked = $('.checkbox:checked').parent().parent();

		// Get ids
		trs_checked.each(function(index, el) {
			ids.push($(el).attr('data-id'));
		});
		
		// Show modal
		$('#notiModal').fadeIn(200);
		$('#notiModal').find('.yes').attr('data-id', ids);

	});

	// DELETE confirmed
	$('.yes').on('click', function() {
		let ids = $(this).attr('data-id').split(',');
		console.log(ids)


		// Send multiple DELETE requests
		ids.forEach( function(element, index) {

			$.ajax({
				url: API_ROOT + '/' + element,
				type: 'DELETE'
			})
			.done(function() {
				console.log("success");
				// Hide modal, hide button
				$('#notiModal').fadeOut(300);
				$('#delete-selected').fadeOut(300);

				// Remove rows
				$('.checkbox:checked').parent().parent().remove();
			})
			.fail(function() {
				console.log("error");
				alert("Delete failed!");
			})
			.always(function() {
				console.log("complete");
			});	
		});			
	});


/*
SEARCH function
*/

	//Search
	$('[type="search"]').on('click', function() {
		getDataAndRender();
		$('th:not(.unsortable)').attr('class', 'normal');
	});

	$('[type="search"]').on('input', function() { 
		if ($(this).val() == '') {//Luôn show hết data lên bảng khi input rỗng
			renderContent(filmsCached);
			$('#no_result').text('');
		}

		let results = [];

		$('th:not(.unsortable)').attr('class', 'normal');

		let input = $('[type="search"]').val().trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');;
		let re = new RegExp(input, 'g'); // make RegExp to search in global (để search những thứ lặp lại nhiều lần)

		if (input == '') renderContent(filmsCached);
		else {
			filmsCached.forEach( function(film, index) {
				for (let key in film) {
					//Nếu data có chứa input
					if (film[key].toString().toLowerCase().indexOf(input) != -1) {

						if (key != 'id') results.push(film);

						break; //Với mỗi film, value của key nào chứa input thì push film đó vào array results, sau đó BREAK luôn để thoát khỏi film hiện tại, tiếp tục với film tiếp theo
					}
				}
			});
	

			renderContent(results);
			
			//Highlight search results
			$('tr').find('td:not(td:first-child, td:last-child)').each(function(index, el) {
				$(this).html($(this).html().toLowerCase().replace(re, `<mark>$&</mark>`));
			});
		}
		console.log(results);
	});

		

/*
SORT function
*/
	let compare = {
		name: function(a,b) {
			if (a < b) return -1;
			else if (a > b) return 1;
			else return 0;
		},
		duration: function(a,b) {
			a = a.replace(":", "");
			b = b.replace(":", "");
			return a - b;
		},
		date: function(a,b) {
			a = new Date(a);
			b = new Date(b);
			return a - b;
		}
	}

	$('th:not(.unsortable)').on('click', function() {
		let column = $('th').index(this);
		let order = $(this).data('sort');
		let $rows = $('tbody tr').toArray(); //lấy các <tr> hiện tại lưu vào 1 mảng

		if ($(this).is('.ascending') || $(this).is('.descending')) {
			console.log('toggled')

			$(this).toggleClass('ascending descending');
			$('tbody').append($rows.reverse());
		}
		if ($(this).is('.normal')) {
			console.log('1st sort')


			$(this).siblings(':not(.unsortable)').attr('class', 'normal'); //Khi sort sang <th> khác thì các <th> còn lại về normal
			$(this).attr('class', 'ascending');

			$rows.sort(function(a, b) {
				a = $(a).find('td').eq(column).text();
				b = $(b).find('td').eq(column).text();
				return compare[order](a,b);
			});
			//không cần $('tbody').empty()
			$('tbody').append($rows);
		}
	});




/* 
Misc
*/
	// Check-all button
	$('th input[type="checkbox"]').on('change', function() {
		$('.checkbox').prop('checked', $(this).prop('checked'));

		if ($(this).prop('checked') === true) {
			if ($('.checkbox')[0]) $('#delete-selected').fadeIn(200);
		} else $('#delete-selected').fadeOut(200);

	});

	$('.close').on('click', function() {
		postModal.fadeOut(300);
		putModal.fadeOut(300);
		notiModal.fadeOut(300);
	});

	$('.no').on('click', function() {
		notiModal.fadeOut(300);
	});

	$(window).on('click', function(event) {
		if (event.target == $('#postModal')[0]) postModal.fadeOut(300);
		if (event.target == $('#putModal')[0]) putModal.fadeOut(300);
		if (event.target == $('#notiModal')[0]) notiModal.fadeOut(300);
	});

/*
Functions
*/

	function getDataAndRender() {
		$.ajax({
			url: API_ROOT,
			type: 'GET',
			dataType: 'json',
			beforeSend: function() {
				$('#alert').text('Loading...');
			},
			complete: function() { //giống kiểu .always()
				$('#alert').text('');
			},
			error: function() { //giống kiểu .fail()
				$('#alert').text('Failed');
			},
			success: function(films) { //giống kiểu .done()
				filmsCached = films;

				renderContent(films);
			}
		});		
	}

	function renderContent(array) {
		// xoá hết cái ban đầu đi render lại
		$('tbody').empty();
		//lặp object films để đổ dữ liệu
		array.forEach( function(element) {
			$('tbody').append(`
				<tr data-id="${element.id}">
					<td><input class="checkbox" type="checkbox" /></td>
					<td>${element.genre}</td>
					<td>${element.title}</td>
					<td>${element.duration}</td>
					<td>${element.date}</td>
					<td>
						<i data-id="${element.id}" class="edit fas fa-edit">&nbsp;Edit
					</td>
				</tr>
			`);
		});

		$('.checkbox').on('change', checkboxEvent);
		$('.edit').on('click', editEvent);

		if (array.length === 0) $('#no_result').text(`No Entries`).show();
		else $('#no_result').text(``);
	}



	function checkboxEvent() {
		// Clear check-all button if one is deselected
		if (!event.target.checked) $('th input[type="checkbox"]').prop('checked', false);

		if (!$('.checkbox:checked')[0]) $('#delete-selected').fadeOut(200);
		else $('#delete-selected').fadeIn(200);	
	}


});
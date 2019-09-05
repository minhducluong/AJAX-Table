$(function() {
	const API_ROOT = '/films';
	const fetchData = () => {
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
				let results = [];
				// let compare = {
				// 	name: function(a,b) {
				// 		if (a < b) return -1;
				// 		else if (a > b) return 1;
				// 		else return 0;
				// 	},
				// 	duration: function(a,b) {
				// 		a = a.replace(":", "");
				// 		b = b.replace(":", "");
				// 		return a - b;
				// 	},
				// 	date: function(a,b) {
				// 		a = new Date(a);
				// 		b = new Date(b);
				// 		return a - b;
				// 	}
				// }

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
							</tr>
						`);
					});

					bindEvent();
			
					if (array.length === 0) $('#no_result').text(`No Entries`).show();
					else $('#no_result').text(``);
				}
				renderContent(films);

				function bindEvent() {
					// When "Edit" is clicked
					$('.edit').on('click', function(event) {
						event.preventDefault();
						let td_Siblings = $(this).parent().siblings();

						putModal.find('legend').attr('data-id', $(this).data('id'));
						putModal.find('#genre').val(td_Siblings[1].textContent);
						putModal.find('#title').val(td_Siblings[2].textContent);
						putModal.find('#duration').val(td_Siblings[3].textContent);
						putModal.find('#date').val(td_Siblings[4].textContent);

						putModal.show();
						putModal.find('#genre').select();
						
					});

					// Check-all button
					$('th input[type="checkbox"]').on('change', function() {
						$('.checkbox').prop('checked', $(this).prop('checked'));

						if ($(this).prop('checked') === true) {
							if ($('.checkbox')[0]) $('#delete-selected').fadeIn(200);
						} else $('#delete-selected').fadeOut(200);

					});

					// Clear check-all button if one is deselected
					$('.checkbox').on('change', function(event) {
						if (!event.target.checked) $('th input[type="checkbox"]').prop('checked', false);

						if (!$('.checkbox:checked')[0]) $('#delete-selected').fadeOut(200);
						else $('#delete-selected').fadeIn(200);
					});

					$('#delete-selected').on('click', function() {
						let ids = [];
						let trs_checked = $('.checkbox:checked').parent().parent();

						// Get ids
						trs_checked.each(function(index, el) {
							ids.push($(el).attr('data-id'));
						});
						
						console.log(ids)

						$('#notiModal').fadeIn(200);
						$('#notiModal').find('.yes').attr('data-id', ids);
		
					});
				}



				//Sort - Sort cái table đang được show ngoài HTML
				// $('th').on('click', function() {
				// 	let column = $('th').index(this);
				// 	let order = $(this).data('sort');
				// 	let rows = $('tbody tr').toArray(); //lấy các <tr> hiện tại lưu vào 1 mảng

				// 	if ($(this).is('.ascending') || $(this).is('.descending')) {
				// 		$(this).toggleClass('ascending descending');
				// 		$('tbody').append(rows.reverse());
				// 	}
				// 	if ($(this).is('.normal')) {
				// 		$(this).siblings(':not(th:last-child)').attr('class', 'normal'); //Khi sort sang <th> khác thì các <th> còn lại về normal
				// 		$(this).attr('class', 'ascending');

				// 		rows.sort(function(a, b) {
				// 			a = $(a).find('td').eq(column).text();
				// 			b = $(b).find('td').eq(column).text();
				// 			return compare[order](a,b);
				// 		});
				// 		//không cần $('tbody').empty()
				// 		$('tbody').append(rows);
				// 	}
				// });


				//Search
				$('[type="search"]').on('input', function() { 
					if ($(this).val() == '') {//Luôn show hết data lên bảng khi input rỗng
						renderContent(films);
						$('#no_result').text('');
						$('th').attr('class', 'normal');
					}

					results = [];
					$('th').attr('class', 'normal');

					let input = $('[type="search"]').val().trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');;
					let re = new RegExp(input, 'g'); // make RegExp to search in global (để search những thứ lặp lại nhiều lần)

					if (input == '') renderContent(films);
					else {
						films.forEach( function(film, index) {
							for (let key in film) {
								//Nếu data có chứa input
								if (film[key].toString().toLowerCase().indexOf(input) != -1) {
									results.push(film);
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
					// console.log(results);
				});
			}
		});
	}

	fetchData();

	$('#postModal form').on('submit', function(event) {
		event.preventDefault();
		$('[type="search"]').val("");
		postModal.hide();

		$.ajax({
			url: API_ROOT,
			type: 'POST',
			dataType: 'json',
			data: {
				genre: $(this).find('#genre').val(),
				title: $(this).find('#title').val(),
				duration: $(this).find('#duration').val(),
				date: $(this).find('#date').val()
			}
		})
		.done(function() {
			console.log("success");
			// Re-fetch data
			fetchData();
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
	});

	$('#putModal form').on('submit', function(event) {
		event.preventDefault();
		// console.log($(this).find('legend')[0].getAttribute('data-id'))
		putModal.hide();

		$.ajax({
			url: API_ROOT + `/${$(this).find('legend')[0].getAttribute('data-id')}`,
			type: 'PUT',
			dataType: 'json',
			data: {
				"genre": $(this).find('#genre').val(),
				"title": $(this).find('#title').val(),
				"duration": $(this).find('#duration').val(),
				"date": $(this).find('#date').val()
			}
		})
		.done(function() {
			console.log("success");
			fetchData();
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
		
	});

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
				// Hide modal
				$('#notiModal').fadeOut(300);

				// Hide rows
				$('.checkbox:checked').parent().parent().remove();

				// Hide delete-selected button if there's nothing left
				if (!$('.checkbox')[0]) $('#delete-selected').hide();
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


	let postModal = $('#postModal');
	let putModal = $('#putModal');
	let notiModal = $('#notiModal');

	$('h3').on('click', function() {
		postModal.show();
		postModal.find('#genre').focus();
		$('input[type="text"]').val("");
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

});
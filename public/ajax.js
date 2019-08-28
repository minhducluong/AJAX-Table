$(function() {
	const fetchData = () => {
		$.ajax({
			url: 'http://localhost:3000/db',
			type: 'GET',
			dataType: 'json',
			beforeSend: function() {
				$('#no_result').text('Loading...');
			},
			complete: function() { //giống kiểu .always()
				$('#no_result').text('Done!').fadeOut(2000);
			},
			error: function() { //giống kiểu .fail()
				$('#no_result').text('Failed');
			},
			success: function(data) { //giống kiểu .done()
				let films = data.films;
				let results = [];
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

				function renderContent(array) {
					// xoá hết cái ban đầu đi render lại
					$('tbody').empty();
					//lặp object films để đổ dữ liệu
					array.forEach( function(element) {
						$('tbody').append(`
							<tr>
								<td>${element.genre}</td>
								<td>${element.title}</td>
								<td>${element.duration}</td>
								<td>${element.date}</td>
								<td>
									<a data-id="${element.id}" class="edit" href="javascript:void(0)">Edit</a> | 
									<a data-id="${element.id}" class="delete" href="javascript:void(0)">Delete</a></td>
							</tr>
						`);
					});

					bindEvent();
				}
				renderContent(films);

				function bindEvent() {
					$('.delete').on('click', function(event) {
						event.preventDefault();
						$(this).parent().parent().hide(400);

						$.ajax({
							url: `http://localhost:3000/films/${$(this).data('id')}`,
							type: 'DELETE'
						})
						.done(function() {
							console.log("success");
						})
						.fail(function() {
							console.log("error");
						})
						.always(function() {
							console.log("complete");
						});
					});

					$('.edit').on('click', function(event) {
						event.preventDefault();

						$.get(`http://localhost:3000/films/${$(this).data('id')}`, function(data) {
							putModal.find('legend').attr('data-id', data.id);
							putModal.find('#genre').val(data.genre);
							putModal.find('#title').val(data.title);
							putModal.find('#duration').val(data.duration);
							putModal.find('#date').val(data.date);
						});

						putModal.show();
						putModal.find('#genre').select();
						
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
						
						// Thông báo No results
						if (!results[0]) $('#no_result').text(`No results`).show();
						else $('#no_result').text(``);

						renderContent(results);
						
						//Highlight search results
						$('tr').find('td:not(td:last-child)').each(function(index, el) {
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
		postModal.hide();

		$.ajax({
			url: 'http://localhost:3000/films',
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
			url: `http://localhost:3000/films/${$(this).find('legend')[0].getAttribute('data-id')}`,
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


	let postModal = $('#postModal');
	let putModal = $('#putModal');

	$('h3').on('click', function() {
		postModal.show();
		postModal.find('#genre').focus();
		$('input[type="text"]').val("");
	});

	$('.close').on('click', function() {
		postModal.hide();
		putModal.hide();
	});

	$(window).on('click', function(event) {
		if (event.target == $('#postModal')[0]) postModal.hide();
		if (event.target == $('#putModal')[0]) putModal.hide();
	});

});
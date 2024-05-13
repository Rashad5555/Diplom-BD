ymaps.ready(['Heatmap']).then(function init() {
    var myMap = new ymaps.Map("map", {
        center: [57.77, 40.93],
        zoom: 12
    }, {
        restrictMapArea: [[57.643834, 40.531073],[57.942011, 41.241367]]
    });
/*
var fullscreenControl = myMap.controls.get('fullscreenControl');

    // Удаляем элемент управления с карты
    myMap.controls.remove(fullscreenControl);
*/
    var heatMapData = []; // Массив для хранения данных тепловых точек
    var heatMapObjects = []; // Массив для хранения объектов тепловых точек
var colors = [
    'rgba(0, 255, 0, 1)',        // Чистый зелёный
    'rgba(25, 230, 0, 1)',       // Зелёный с небольшим оттенком жёлтого
    'rgba(51, 204, 0, 1)',       // Зелёно-жёлтый
    'rgba(76, 179, 0, 1)',       // Тёмный зелёно-жёлто-зелёный
    'rgba(102, 153, 0, 1)',      // Тёмный зелёно-жёлтый
    'rgba(128, 128, 0, 1)',      // Тёмный жёлто-коричневый
    'rgba(153, 102, 0, 1)',      // Красно-жёлтый
    'rgba(179, 76, 0, 1)',       // Красно-коричневый
    'rgba(204, 51, 0, 1)',       // Тёмный красно-оранжевый
    'rgba(230, 25, 0, 1)',       // Красный с небольшим оттенком оранжевого
    'rgba(255, 0, 0, 1)'         // Чистый красный
];
var nestedArray = [];
/*
var text_color = [
    'Нет качества',
    'Очень плохое качество',
    'Плохое качество',
    'Качество ниже среднего',
    'Среднее качество',
    'Хорошее качество',
    'Очень хорошее качество',
    'Отличное качество',
    'Исключительное качество',
    'Выдающееся качество',
    'Отличное качество'
];
*/
var text_opisanie = [
    '0 - Крайне непривлекательно',
    '1 - Очень плохо',
    '2 - Плохо',
    '3 - Ниже среднего',
    '4 - Средне',
    '5 - Средне-выше среднего',
    '6 - Хорошо',
    '7 - Хорошо выше среднего',
    '8 - Очень хорошо',
    '9 - Отлично',
    '10 - Идеально'
];

function fetchDataFromDatabase() {
    // Функция для добавления тепловых точек
function addHeatmap(selectedGroups) {
    removeHeatmap(); // Удаляем все текущие тепловые точки

    var existingCoordinates = {}; // Объект для хранения уже добавленных координат
    var aggregatedData = {}; // Объект для хранения агрегированных данных

    var requests = selectedGroups.map(function(selectedGroup) {
        return $.ajax({
            url: '/api/data',
            type: 'GET',
            data: { selectedGroup: selectedGroup },
            success: function(response) {
                console.log(response); // Выводим полученные данные в консоль
                var counts = [];
                // Находим выбранную группу в списке групп
                var selectedGroupData = response.groups.find(function(group) {
                    return group.name === selectedGroup;
                });

                // Если группа найдена, получаем соответствующие ей координаты и веса
                if (selectedGroupData) {
                    // Получаем идентификатор группы
                    var groupId = selectedGroupData.id;

                    // Фильтруем данные из таблицы Summary по идентификатору группы
                    var groupSummary = response.summary.filter(function(summary) {
                        return summary.group_id === groupId;
                    });

                    // Добавление подсчёта тональности отзыва. Запись тональностей для текущей группы.
                    groupSummary.forEach(function(sm) {
                             counts.push(sm.raions_id)
                             counts.push(sm.count_positive_reviews);
                             counts.push(sm.count_negative_reviews);
                             counts.push(sm.count_neutral_reviews);});

                    for (let i = 0; i < counts.length; i += 4) {
                      nestedArray.push(counts.slice(i, i + 4));
                    }

                    /*console.log(nestedArray);*/



                    console.log(nestedArray);
                    // Для каждой записи в groupSummary получаем координаты из таблицы Raions
                    groupSummary.forEach(function(summary) {
                        var raionId = summary.raions_id;
                        var raionData = response.coordinates.find(function(coord) {
                            return coord.id === raionId;
                        });

                        if (raionData) {
                            var weight = summary.likeness;
                            var coordinates = [parseFloat(raionData.coord_y), parseFloat(raionData.coord_x)];

                            // Формируем ключ для координат
                            var key = coordinates.join(',');

                            // Если координаты уже существуют в объекте aggregatedData, добавляем к сумме весов и увеличиваем количество точек
                            if (aggregatedData[key]) {
                                aggregatedData[key].sum += weight;
                                aggregatedData[key].count++;
                            } else {
                                // Если координаты не существуют, инициализируем их сумму весов и количество точек
                                aggregatedData[key] = { sum: weight, count: 1 };
                                existingCoordinates[key] = true; // Добавляем координаты в объект existingCoordinates
                            }
                        }
                    });
                } else {
                    console.error('Группа не найдена');
                }
            },
            error: function(error) {
                console.error('Ошибка при получении данных:', error);
            }
        });
    });

    // Выполняем все запросы асинхронно
    $.when.apply($, requests).done(function() {
        // Перебираем объект aggregatedData и вычисляем среднее арифметическое для каждой координаты
        for (var key in aggregatedData) {
            if (aggregatedData.hasOwnProperty(key)) {
                var coordinates = key.split(',').map(parseFloat);
                var sum = aggregatedData[key].sum;
                var count = aggregatedData[key].count;
                var averageWeight = Math.ceil(sum / count); // Округляем вверх среднее арифметическое

                // Добавляем координаты с средним весом в агрегированные данные
                heatMapData.push(coordinates.concat(averageWeight));
            }
        }

        // Создаем тепловую карту на основе агрегированных данных
        heatMapData.forEach(function(data) {
            var weight = data[2];
            var heatmapGradient = getHeatmapGradient(weight);
            var heatmap = new ymaps.Heatmap([data], {
                radius: 40,
                innerRadius: 30,
                dissipating: false,
                opacity: 0.8,
                intensityOfMidpoint: 0.2,
                gradient: heatmapGradient
            });

            myMap.options.set('fullscreenZIndex', 1);
            heatmap.setMap(myMap);
            heatMapObjects.push(heatmap);
        });
    });
}



// Создаем кнопку
var layerButton = new ymaps.control.Button({
    data: { content: 'Диаграмма' }
});
myMap.controls.add(layerButton, { float: 'none', position: { top: 80, right: 10 } });
layerButton.options.set('maxWidth', 200); // Устанавливаем максимальную ширину кнопки в пикселях
layerButton.options.set('minWidth', 150); // Устанавливаем минимальную ширину кнопки в пикселях
myMap.options.set('fullscreenZIndex', 1);

function countHeatmapPoints() {
    var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0]; // Инициализируем массив для подсчета количества точек каждого цвета
    var totalPoints = heatMapData.length; // Общее количество точек

    // Проходим по всем точкам на карте и увеличиваем счетчик для соответствующего цвета
    for (var j = 0; j < totalPoints; j++) {
        var weight = heatMapData[j][2];
        if (weight >= 10) {
            counts[0]++;
        } else if (weight >= 9) {
            counts[1]++;
        } else if (weight >= 8) {
            counts[2]++;
        } else if (weight >= 7) {
            counts[3]++;
        } else if (weight >= 6) {
            counts[4]++;
        } else if (weight >= 5) {
            counts[5]++;
        } else if (weight >= 4) {
            counts[6]++;
        } else if (weight >= 3) {
            counts[7]++;
        } else if (weight >= 2) {
            counts[8]++;
        } else if (weight >= 1) {
            counts[9]++;
        }   else {
            counts[10]++;
        }
    }
    return { counts: counts, totalPoints: totalPoints };
}

// Обработчик события для кнопки "Диаграмма"
layerButton.events.add('click', function (event) {
    var modal_color = document.createElement('div');
    modal_color.className = 'modal fade';
    modal_color.id = 'bs-modal';
    modal_color.tabIndex = '1';
    modal_color.setAttribute('role', 'dialog');
    modal_color.setAttribute('data-backdrop', 'static');
    modal_color.innerHTML = '<div class="modal-dialog" role="document">' +
                          '<div class="modal-content">' +
                              '<div class="modal-header">' +
                                  '<h5 class="modal-title">Диаграмма по районам</h5>' +
                                  '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                                      '<span aria-hidden="true">&times;</span>' +
                                  '</button>' +
                              '</div>' +
                               '<div class="modal-body" style="height: 270px;">'+ // Увеличил высоту для графика
                                '<canvas id="chart"></canvas>' +
                               '</div>' +
                          '</div>' +
                      '</div>';
    document.body.appendChild(modal_color);

    // Получаем ссылку на canvas для графика
    var canvas = modal_color.querySelector('#chart');

    // Уничтожаем предыдущий экземпляр Chart, если он есть
    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    // Рисуем график
    drawChart(canvas);

    // Показываем модальное окно
    $(modal_color).modal('show');
});
// Функция для отображения графика
function drawChart(canvas) {
    var data = countHeatmapPoints(); // Получаем количество точек каждого цвета и общее количество точек
    var counts = data.counts;
    var totalPoints = data.totalPoints;

    // Настройки графика
    var ctx = canvas.getContext('2d');
    canvas.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1','0'], // Веса точек
            datasets: [{
                label: 'Количество всего', // Убрал отображение числа в подписи
                data: counts, // Количество точек каждого цвета
                backgroundColor: [colors[0], colors[1], colors[2], colors[3],colors[4], colors[5], colors[6], colors[7],colors[8], colors[9], colors[10]],
                borderColor: [colors[0], colors[1], colors[2], colors[3],colors[4], colors[5], colors[6], colors[7],colors[8], colors[9], colors[10]],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Количество районов по цвету'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Степень привлекательности'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        generateLabels: function(chart) {
                            return [{
                                text: '', // Пустая строка для скрытия подписи в легенде
                                datasetIndex: 0
                            }];
                        }
                    },
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Количество всего районов: ' + totalPoints // Используем заголовок для отображения общего количества районов
                },
                legend: {
                    labels: {
                        filter: function(item) {
                            return !item.text.includes('Количество всего');
                        }
                    }
                }
            }
        }
    });
}
// Функция для получения градиента тепловой карты в зависимости от веса
function getHeatmapGradient(weight) {
    if (weight >= 10) {
        return { 0.1: colors[0] };
    } else if (weight >= 9) {
        return { 0.1: colors[1] };
    } else if (weight >= 8) {
        return { 0.1: colors[2] };
    } else if (weight >= 7) {
        return { 0.1: colors[3] };
    } else if (weight >= 6) {
        return { 0.1: colors[4] };
    } else if (weight >= 5) {
        return { 0.1: colors[5] };
    } else if (weight >= 4) {
        return { 0.1: colors[6] };
    } else if (weight >= 3) {
        return { 0.1: colors[7] };
    } else if (weight >= 2) {
        return { 0.1: colors[8] };
    } else if (weight >= 1) {
        return { 0.1: colors[9] };
    } else {
        return { 0.1: colors[10] };
    }
}


// Создаем кнопку
var ratingButton = new ymaps.control.Button({
    data: { content: 'Рейтинг' }
});
myMap.controls.add(ratingButton, { float: 'none', position: { top: 112, right: 10 } });
ratingButton.options.set('maxWidth', 200); // Устанавливаем максимальную ширину кнопки в пикселях
ratingButton.options.set('minWidth', 150); // Устанавливаем минимальную ширину кнопки в пикселях
myMap.options.set('fullscreenZIndex', 1);

// Обработчик события для кнопки "Диаграмма"
ratingButton.events.add('click', function (event) {
    var modal_color = document.createElement('div');
    modal_color.className = 'modal fade';
    modal_color.id = 'bs-modal';
    modal_color.tabIndex = '1';
    modal_color.setAttribute('role', 'dialog');
    modal_color.setAttribute('data-backdrop', 'static');
    modal_color.innerHTML = '<div class="modal-dialog" role="document">' +
                          '<div class="modal-content">' +
                              '<div class="modal-header">' +
                                  '<h5 class="modal-title">Диаграмма лучших районов</h5>' +
                                  '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                                      '<span aria-hidden="true">&times;</span>' +
                                  '</button>' +
                              '</div>' +
                               '<div class="modal-body" style="height: 270px;">'+ // Увеличил высоту для графика
                                '<canvas id="chart"></canvas>' +
                               '</div>' +
                          '</div>' +
                      '</div>';
    document.body.appendChild(modal_color);

    // Получаем ссылку на canvas для графика
    var canvas = modal_color.querySelector('#chart');

    // Уничтожаем предыдущий экземпляр Chart, если он есть
    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    // Рисуем график
    drawRating(canvas);

    // Показываем модальное окно
    $(modal_color).modal('show');
});

function findTopEstateObjects() {
  const topEstateObjects = heatMapData.slice().sort((a, b) => b[2] - a[2]).slice(0, 8);
  return topEstateObjects;/*return { counts: counts, totalPoints: totalPoints };*/
}

function drawRating(canvas) {
    var data = findTopEstateObjects(); // Получаем топ 15 объектов недвижимости

    var weights = data.map(function(obj) {
        return obj[2];
    });
    var coords = data.map(function(obj) {
        return [obj[0], obj[1]];
    });
    $.ajax({
        url: '/api/data',
        type: 'GET',
        success: function(response) {
           var district_names = [];
            // Initialize the array
            coords.forEach(function(coord) {
                console.log('coords[0]', coord[0]);
                console.log('coords[1]', coord[1]);
                response.coordinates.forEach(function(coordinate) {
                    if (coord[0] == coordinate.coord_y && coord[1] == coordinate.coord_x) {
                        // Находим соответствующий район по координатам
                        var raionData = response.raions.find(function(raion) {
                            return raion.coords_id === coordinate.id;
                        });
                        if (raionData) {
                            district_names.push(raionData.name);
                        }
                    }
                });
            });

            var ctx = canvas.getContext('2d');
            canvas.chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: district_names,
                    datasets: [{
                        label: 'Степень привлекательности',
                        data: weights,
                        backgroundColor: [colors[0]],
                        borderColor: [colors[0]],
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Название районов'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Степень привлекательности'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Рейтинг 8 лучших районов'
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    });
}

function removeHeatmap() {
        for (var i = 0; i < heatMapObjects.length; i++) {
            heatMapObjects[i].setMap(null);
        }
        heatMapData = [];
        heatMapObjects = [];
        // Добавление подсчёта тональности отзыва. Очистка массива
        nestedArray=[];
    }


var createModal = function(title) {
    var modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'bs-modal';
    modal.tabIndex = '-1';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('data-backdrop', 'static');
    //modal.style.zIndex = '20000'; // Устанавливаем z-index для модального окна

    modal.innerHTML = '<div class="modal-dialog" role="document">' +
                          '<div class="modal-content">' +
                              '<div class="modal-header">' +
                                  '<h5 class="modal-title">' + title + '</h5>' +
                                  '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                                      '<span aria-hidden="true">&times;</span>' +
                                  '</button>' +
                              '</div>' +
                              '<div class="modal-body"></div>' +
                              '<div class="modal-footer">' +
                                  '<button type="button" class="btn btn-secondary" data-dismiss="modal">Закрыть</button>' +
                              '</div>' +
                          '</div>' +
                      '</div>';
    document.body.appendChild(modal);
    return modal;
};

function handleHeatmapClick(e, counts) {
    var coords = e.get('coords');
    var weight;
    var title;
    /*let ids = [];
    let results = [];*/
    var epsilon = 0.00001; // Значение для допуска

    // Функция для сравнения координат с использованием допуска
    function compareCoordinates(coord1, coord2) {
        return Math.abs(coord1 - coord2) < epsilon;
    }

    // Отправляем запрос на сервер Flask для получения данных о районах
$.ajax({
    url: '/api/data',
    type: 'GET',
    success: function(response) {
        // Находим район, соответствующий координатам клика
        let results = [];
        /// Добавление подсчёта тональности отзыва. Поиск id кликнутого района
        let found_click_raions = response.coordinates.find(function(coordin) {
            var distance = getDistance(coords, [coordin.coord_y, coordin.coord_x]);
            if (distance < 0.3) { return coordin;}
        });

        console.log(found_click_raions)
        if (found_click_raions !== undefined) {
            console.log(" id района:", found_click_raions.id);
            let title = response.raions.find(function(raion) {
                     if (raion.coords_id === found_click_raions.id)
                                 {return raion; }
                            }).name;

            console.log('title',title)

            /// Добавление подсчёта тональности отзыва. Проход по вложенному массиву, для фильтра по id выбранного района
            nestedArray.forEach(function(element) {
                // Проверяем условие на равенство id района
                if (element[0] === found_click_raions.id) {
                    // Если условие выполняется, вы можете обращаться к другим элементам внутреннего массива
                    console.log("Число positive reviews:", element[1]);
                    console.log("Число negative reviews:", element[2]);
                    console.log("Число neutral reviews:", element[3]);
                    results.push(element[1]);
                    results.push(element[2]);
                    results.push(element[3]);
                }
            });
             var aggregatedReviews = [0, 0, 0]; // Инициализируем массив для агрегированных отзывов
            for (var i = 0; i < results.length; i++) {
                aggregatedReviews[i % 3] += results[i]; // Добавляем значение к соответствующему типу отзыва
            }
            console.log(aggregatedReviews); // Выводим агрегированные отзывы в консоль
            console.log(results);
                // Находим вес точки для заголовка
                for (var i = 0; i < heatMapData.length; i++) {
                    var point = heatMapData[i];
                    var distance = getDistance(coords, [point[0], point[1]]);
                    if (distance < 0.3) {
                        weight = point[2];
                        break;
                    }
                }

                // Создаем модальное окно с полученным названием района в качестве заголовка
                var modal = createModal(title);
                var modalBody = modal.querySelector('.modal-body');
                /*
                // Используем массив text_color для определения текста в зависимости от веса
                var text;
                for (var j = 10; j < text_color.length; j--) {
                    if (weight >= 0 + j) {
                        text = text_color[j];
                        break;
                    }
                }
                */
modalBody.innerHTML =
    '<p>Степень привлекательности: ' + weight + '<br>Оценок степени привлекательности всего 11: ' + text_opisanie.join(', ') + '</p>' +
    '<p>Число позитивных отзывов: ' + aggregatedReviews[0] + '</p>' +
    '<p>Число негативных отзывов: ' + aggregatedReviews[1] + '</p>' +
    '<p>Число нейтральных отзывов: ' + aggregatedReviews[2] + '</p>';

                    var modalFooter = modal.querySelector('.modal-footer');
                    $(modal).modal('show');}
                else {console.log('id не найден')}
        },
        error: function(error) {
            console.error('Ошибка при получении данных:', error);
        }
    });
}

// Вычисляем расстояние между двумя точками
function getDistance(coords1, coords2) {
    var dx = coords2[0] - coords1[0];
    var dy = coords2[1] - coords1[1];
    return Math.sqrt(dx * dx + dy * dy) * 500;
}

// Добавляем обработчик кликов по тепловой карте
myMap.events.add('click', handleHeatmapClick);
myMap.options.set('fullscreenZIndex', 1);


$.ajax({
    url: '/api/data',
    type: 'GET',
    success: function(response) {
        console.log(response); // Выводим полученные данные в консоль
        var groups = response.groups; // Получаем данные о группах из ответа сервера
        var items = [];
        var selectedGroups = []; // Массив для хранения выбранных групп
        var selectedItems = [];
        if (groups) {
            groups.forEach(function(group) {
                var item = new ymaps.control.ListBoxItem({
                    data: { content: group.name },
                });
                item.events.add('click', function(event) {
                    loadAllButton.options.set('visible', true);
                    var target = event.get('target');
                    var selectedGroup = target.data.get('content');
                    if (selectedGroup) {
                        var isChecked = target.isSelected();
                        if (!isChecked) {
                            selectedGroups.push(selectedGroup); // Добавляем выбранную группу в массив
                        } else {
                            var index = selectedGroups.indexOf(selectedGroup);
                            if (index !== -1) {
                                selectedGroups.splice(index, 1); // Удаляем выбранную группу из массива
                            }
                        }
                        // Обновляем массив выбранных элементов в listbox
                        selectedItems = items.filter(function(item) {
                            return item.isSelected();
                        });
                        // Проверяем количество выбранных групп
                        if (selectedGroups.length >= 3) {
                            deleteButton.options.set('visible', true); // Показываем кнопку "Удалить"
                        } else {
                            deleteButton.options.set('visible', false); // Скрываем кнопку "Удалить"
                        }
                        addHeatmap(selectedGroups); // Передаем массив выбранных групп для отображения на тепловой карте
                    }
                });
                items.push(item);
            });
        } else {
            console.error('Данные о группах не получены или пусты.');
        }
        var listBoxWithCheckbox = new ymaps.control.ListBox({
            data: { content: 'Выбрать группу' },
            items: items
        });
        // Добавляем элемент управления на карту
        myMap.controls.add(listBoxWithCheckbox, { float: 'none', position: { right: 10, top: 45 } });

        // Создаем кнопку "Удалить"
        var deleteButton = new ymaps.control.Button({
            data: { content: 'Удалить все' },
            options: { visible: false } // Сначала кнопка будет скрыта
        });
        // Добавляем обработчик клика на кнопку "Удалить"
        deleteButton.events.add('click', function(event) {
            // Очищаем массив выбранных групп
            selectedGroups = [];
            // Снимаем галочки у всех элементов списка
            items.forEach(function(item) {
                item.deselect();
            });
            // Передаем пустой массив для удаления всех слоев с тепловой карты
            addHeatmap(selectedGroups);
            // Скрываем кнопку "Удалить"
            deleteButton.options.set('visible', false);
            loadAllButton.options.set('visible', true);
        });

        // Добавляем кнопку "Удалить" на карту
        myMap.controls.add(deleteButton, { float: 'none', position: { right: 145, top: 45 } });
        deleteButton.options.set('maxWidth', 200); // Устанавливаем максимальную ширину кнопки в пикселях
        deleteButton.options.set('minWidth', 150); // Устанавливаем минимальную ширину кнопки в пикселях

        // Создаем кнопку "Загрузить все"
        var loadAllButton = new ymaps.control.Button({
            data: { content: 'Выбрать все' }
        });
// Добавляем обработчик клика на кнопку "Загрузить все"
loadAllButton.events.add('click', function(event) {
    // Собираем все группы в массив выбранных групп
    selectedGroups = groups.map(function(group) {
        return group.name;
    });
    // Устанавливаем галочки для всех элементов списка
    items.forEach(function(item) {
        item.select();
    });
    // Показываем кнопку "Удалить"
    deleteButton.options.set('visible', true);
    // Обновляем тепловую карту
    addHeatmap(selectedGroups);
    loadAllButton.options.set('visible', false);
});
        // Добавляем кнопку "Загрузить все" на карту
        myMap.controls.add(loadAllButton, { float: 'none', position: { right: 10, top: 145 } });
        loadAllButton.options.set('maxWidth', 200); // Устанавливаем максимальную ширину кнопки в пикселях
        loadAllButton.options.set('minWidth', 150); // Устанавливаем минимальную ширину кнопки в пикселях
    },
    error: function(error) {
        console.error('Ошибка при получении данных:', error);
    }
});

/*
 myMap.events.add('click', function (e) {
    var activeItems = listBoxWithCheckbox.state.get('activeItems');
    if (activeItems && activeItems.length > 0) {
        var group = activeItems[0].data.get('content');
        handleHeatmapClick(e, group); // Передаем выбранную группу в функцию
    } else {
    }
});*/

}
fetchDataFromDatabase();

});

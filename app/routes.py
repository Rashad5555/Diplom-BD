# -*- coding: utf-8 -*-
from app import app
from flask import render_template,url_for,redirect, flash,request

#from app.tables import Raions,Group_Home,Summary

from datetime import datetime

import os

from flask import jsonify
from app.tables import Raions, Group_Home, Summary, Point_Coordinate
from app import app, db_session

@app.route('/api/data')
def get_data_from_database():
    try:
        coordinates_data = db_session.query(Point_Coordinate).all()
        coordinates_list = [{'id': coordinate.id, 'coord_x': coordinate.coord_x, 'coord_y': coordinate.coord_y } for coordinate in coordinates_data]
        # Получаем данные из базы данных из таблицы Raions Районов
        raions_data = db_session.query(Raions).all()
        # Преобразуем данные в список для JSON
        raions_list = [{'id': raion.id, 'name': raion.name, 'coords_id': raion.coords_id} for raion in raions_data]
        


        # Получаем данные из базы данных из таблицы Summary Общая таблица
        summary_data = db_session.query(Summary).all()
        # Преобразуем данные в список для JSON
        summary_list = [{'id': summary.id,
                         'raions_id': summary.raions_id,
                         'group_id': summary.group_id,
                         'likeness': summary.likeness,
                         'count_negative_reviews': summary.count_negative_reviews,
                         'count_neutral_reviews': summary.count_neutral_reviews,
                         'count_positive_reviews': summary.count_positive_reviews} for summary in summary_data]

        # Получаем данные из базы данных Group_Home Таблица с группами
        group_data = sorted(db_session.query(Group_Home).all(), key=lambda x: x.id)
        # Преобразуем данные в список для JSON
        group_list = [{'id': group.id, 'name': group.name} for group in group_data]

        db_session.close()
        # Возвращаем данные в формате JSON
        return jsonify({'coordinates':coordinates_list,'raions': raions_list, 'summary': summary_list, 'groups': group_list})
        #return jsonify({'raions': raions_list, 'summary': summary_list, 'groups': group_list})

    except Exception as e:
        # Если произошла ошибка, возвращаем ошибку в формате JSON
        return jsonify({'error': str(e)})


@app.route('/api/raions-by-coordinates', methods=['GET'])
def get_raions_by_coordinates():
    try:
        
        # Get the coordinates from the request query parameters
        coordinates_str = request.args.get('coordinates')
        coordinates = [float(x) for x in coordinates_str.strip('[]').split(',')]
        coord_x, coord_y = coordinates
        print(f'coord_ x {coord_x} +  coord_ y {coord_y}')
        # Query the database to get the raions that match the coordinates
        raions_data = db_session.query(Raions).filter(Raions.coord_x == coord_x, Raions.coord_y == coord_y).all()
        print(f'raions data {district_names}')
        # Convert the data to a list of district names
        district_names = [raion.name for raion in raions_data]
        print(f'district_names {district_names}')
        db_session.close()
        # Return the list of district names in JSON format
        return jsonify({'districts': district_names})

    except Exception as e:
        # If an error occurs, return the error in JSON format
        return jsonify({'error': str(e)})

'''
        @app.route('/api/data')
def get_data_from_database():
    try:
        # Получаем данные из базы данных из таблицы Group_Home
        group_data = sorted(db_session.query(Group_Home).all(), key=lambda x: x.id)
        data = []

        for group in group_data:
            # Получаем связанные данные из таблицы Summary для текущей группы
            group_summary_data = db_session.query(Summary).filter_by(group_id=group.id).all()

            # Формируем структуру данных для текущей группы
            group_info = {
                'id': group.id,
                'name': group.name,
                'coordinates': []
            }

            # Добавляем информацию о районах и их привлекательности для текущей группы
            for summary in group_summary_data:
                raion_info = {
                    'raions_id': summary.raions_id,
                    'likeness': summary.likeness
                }
                group_info['coordinates'].append(raion_info)

            # Добавляем данные текущей группы в список данных
            data.append(group_info)

        db_session.close()
        # Возвращаем данные в формате JSON
        return jsonify(data)

    except Exception as e:
        # Если произошла ошибка, возвращаем ошибку в формате JSON
        return jsonify({'error': str(e)})


from flask import jsonify, request
from app.tables import Raions, Group_Home, Summary
from app import app, db_session
import json


@app.route('/api/categories')
def categories():
    try:
        # Получаем данные из базы данных из таблицы Group_Home
        group_data = sorted(db_session.query(Group_Home).all(), key=lambda x: x.id)
        serialized_data = [{'id': group.id, 'name': group.name} for group in group_data]
        db_session.close()
        # Возвращаем данные в формате JSON
        return jsonify(serialized_data)

    except Exception as e:
        # Если произошла ошибка, возвращаем ошибку в формате JSON
        return jsonify({'error': str(e)})


@app.route('/api/markers')
def markers():
    try:
        query = request.args.get('categories_id')
        query = json.loads(query)

        # Получаем данные из базы данных из таблицы Group_Home
        # group_data = db_session.query(Group_Home).all()
        result = db_session.query(Summary).filter(Summary.group_id.in_(query)).all()

        # db_session.close()
        # Возвращаем данные в формате JSON
        return jsonify([r.to_dict() for r in result])

    except Exception as e:
        # Если произошла ошибка, возвращаем ошибку в формате JSON
        return jsonify({'error': str(e)})
'''

@app.route('/')
@app.route('/begin')
def index():
    return render_template("index.html")

    

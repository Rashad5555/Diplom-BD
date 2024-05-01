# -*- coding: utf-8 -*-
from app import app
from flask import render_template,url_for,redirect, flash,request

from app.tables import Raions,Group_Home,Summary

from datetime import datetime

import os

from flask import jsonify
from app.tables import Raions, Group_Home, Summary
from app import app, db_session

@app.route('/api/data')
def get_data_from_database():
    try:
        # Получаем данные из базы данных из таблицы Raions Районов
        raions_data = db_session.query(Raions).all()
        # Преобразуем данные в список для JSON
        raions_list = [{'id': raion.id, 'name': raion.name, 'coord_x': raion.coord_x, 'coord_y': raion.coord_y} for raion in raions_data]

        # Получаем данные из базы данных из таблицы Summary Общая таблица
        summary_data = db_session.query(Summary).all()
        # Преобразуем данные в список для JSON
        summary_list = [{'id': summary.id, 'raions_id': summary.raions_id, 'group_id': summary.group_id, 'likeness': summary.likeness} for summary in summary_data]

        # Получаем данные из базы данных Group_Home Таблица с группами
        group_data = db_session.query(Group_Home).all()
        # Преобразуем данные в список для JSON
        group_list = [{'id': group.id, 'name': group.name} for group in group_data]

        # Возвращаем данные в формате JSON
        return jsonify({'raions': raions_list, 'summary': summary_list, 'groups': group_list})

    except Exception as e:
        # Если произошла ошибка, возвращаем ошибку в формате JSON
        return jsonify({'error': str(e)})


@app.route('/')
@app.route('/begin')
def index():
    return render_template("index.html")

    

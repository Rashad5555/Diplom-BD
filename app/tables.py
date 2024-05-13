# from app import db

from datetime import datetime
from sqlalchemy.orm import relationship, backref
from sqlalchemy import *
from app.db_init import Base




class Point_Coordinate(Base):
    __tablename__ = 'coordinates'
    id = Column(Integer, primary_key=True)
    coord_x = Column(Float, nullable=False)
    coord_y = Column(Float, nullable=False)

    def __repr__(self):
        return f"<Point_Coordinate( x='{self.coord_x}', y'{self.coord_y}' )>"

class Raions(Base):
    __tablename__ = 'objects_estate'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(80), nullable=False)
    coords_id = Column(Integer, ForeignKey('coordinates.id'),nullable=False)
    point_coord = relationship("Point_Coordinate", backref=backref('objects_estate'))
    
    def __repr__(self):
        return f"<Raions(name='{self.name}', department='{self.coords_id}' )>"


class Group_Home(Base):
    __tablename__ = 'groups_home'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(80), unique=True, nullable=False)

    def __repr__(self):
        return f"<Group(name='{self.id}', Title='{self.name}')>"


class Summary(Base):
    __tablename__ = 'summary'
    id = Column(Integer, primary_key=True, autoincrement=True)
    raions_id = Column(Integer, ForeignKey('objects_estate.id'))
    group_id = Column(Integer, ForeignKey('groups_home.id'))
    likeness = Column(Integer)
    count_negative_reviews = Column(Integer)
    count_neutral_reviews = Column(Integer)
    count_positive_reviews = Column(Integer)
    raions = relationship("Raions", backref=backref('summary', cascade="all, delete-orphan"))
    group = relationship("Group_Home", backref=backref('summary', cascade="all, delete-orphan"))

    def to_dict(self):
        raions_obj = self.raions
        return {
            'id': self.id,
            'raions_id': self.raions_id,
            'group_id': self.group_id,
            'likeness': self.likeness,
            'coords_id': raions_obj.coords_id,

        }

    def __repr__(self):
        return f"<Summary(name='{self.id}', Raions='{self.raions_id}', Groups='{self.group_id}')>"
        # return {self.id, self.raions_id, self.group_id}

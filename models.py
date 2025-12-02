from . import db
from datetime import datetime

favorites_table = db.Table(
    'favorites',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('item_id', db.Integer, db.ForeignKey('items.id'), primary_key=True),
    db.Column('item_type', db.String(10)),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

ratings_table = db.Table(
    'ratings',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('item_id', db.Integer, db.ForeignKey('items.id'), primary_key=True),
    db.Column('rating', db.Float, nullable=False),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    favorites = db.relationship(
        'Item',
        secondary=favorites_table,
        backref=db.backref('favorited_by', lazy='dynamic'),
        lazy='dynamic'
    )
    
    ratings = db.relationship(
        'Item',
        secondary=ratings_table,
        backref=db.backref('rated_by', lazy='dynamic'),
        lazy='dynamic'
    )
    
    def __repr__(self):
        return f"<User {self.nickname}>"

class Item(db.Model):
    __tablename__ = 'items'
    
    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(10), nullable=False) 
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    year = db.Column(db.String(10))
    genre = db.Column(db.String(50))
    rating = db.Column(db.Float)
    studio = db.Column(db.String(100))
    duration = db.Column(db.String(20))
    image_url = db.Column(db.String(300))
    trailer_url = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Item {self.title} ({self.type})>"


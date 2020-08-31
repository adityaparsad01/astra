import os
import json
import myfitnesspal
import dateutil.parser
from pprint import pprint
from datetime import timedelta, date
from http.server import BaseHTTPRequestHandler
from datetime import datetime

class handler(BaseHTTPRequestHandler):

  def do_GET(self):
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.end_headers()

    client = myfitnesspal.Client(os.environ.get('USERNAME'), password=os.environ.get('PASSWORD'))
    date_obj = date.today()
    delta = timedelta(days=1)

    data = {}

    day = client.get_date(date_obj.year, date_obj.month, date_obj.day)
    if(day.totals == {}):
      self.wfile.write(json.dumps(data, indent=4).encode())
      return


    meals = day.meals

    data['meals'] = {}

    for meal in meals:
      meal_obj = {'entries': []}
      meal_obj['total'] = meal.totals

      data['meals'][meal.name] = meal_obj

      entries = meal.entries

      for entry in entries:
          data['meals'][meal.name]['entries'].append({'name': entry.name, 'total': entry.totals})

    data['total'] = day.totals
    data['water'] = day.water
    data['weight'] = list(client.get_measurements('Weight', date_obj - delta, date_obj).values())[0]

    self.wfile.write(json.dumps(data, indent=4).encode())
    return
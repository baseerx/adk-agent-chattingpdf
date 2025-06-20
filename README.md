This project is handling adk agent which is sending request to tool/function then that fetches information from external fastapi end point.


for adk api_server and utilizing agent via api you need to use the following
http://127.0.0.1:9001/apps/pdfchat/users/u-123/sessions/s_123
http://127.0.0.1:9001/run

for handling api_server cors
adk api_server --allow_origins=http://localhost:5173 --host=0.0.0.0



-> manager agent calls sub agents and then we use tools inside those sub agents
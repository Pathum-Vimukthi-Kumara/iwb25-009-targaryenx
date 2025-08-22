@echo off
echo Creating contact_messages table...
mysql -u root -p vconnect < contact_table.sql
echo Table created successfully!
pause
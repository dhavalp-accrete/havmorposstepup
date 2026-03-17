# Included files
!include LogicLib.nsh
Section # call UserInfo plugin to get user info.  The plugin puts the result in the stack
   
	
	
SectionEnd

!macro customInstall
	
	
	StrCpy $R0 '"$SYSDIR\cmd.exe" /c "sc QUERY wampmariadb64 | FIND /C "RUNNING""'
	nsExec::ExecToStack '$R0'
	
	Pop $R1  # contains return code
	Pop $R2  # contains 
	
	${if} $R1 = 0
		# command success
		
		${if} $R2 = 1
		# it's running
		Goto RestoreDB 
		
		${else}
			ExecWait '"$SYSDIR\cmd.exe" /c "net start wampmariadb64"' 
			Goto RestoreDB
		${endif}
			
	${else}
		# command failed		
		ExecWait '"$SYSDIR\cmd.exe" /c "net start wampmariadb64"' 
		Goto RestoreDB
		 
	${endif} 
	
	RestoreDB:
	ExecWait '"C:\wamp64\bin\mariadb\mariadb10.4.10\bin\mysql" --user=root --execute="use billberry"' $R0
	
	StrCmp $R0 "1" 0 dbexists 
	  
	ExecWait '"C:\wamp64\bin\mariadb\mariadb10.4.10\bin\mysql" --user=root --execute="source $INSTDIR\resources\db.sql"'
	  
	  
	dbexists:	
	FileOpen  $0 "$INSTDIR\resources\db.sql" w	
	FileWrite $0 ""
	FileClose $0
	
	AccessControl::GrantOnFile "$INSTDIR\resources" "(BU)" "FullAccess"
	
  
!macroend


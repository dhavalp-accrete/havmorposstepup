# Included files
!include LogicLib.nsh

# --- Logging helpers --------------------------------------------------------
# Writes a single line to the installer details window AND appends it to a
# persistent log file at $INSTDIR\install.log so it survives after the
# installer closes. Read the log later from C:\Program Files (x86)\havmor\install.log
!macro Log msg
	DetailPrint "${msg}"
	Push $9
	ClearErrors
	FileOpen $9 "$INSTDIR\install.log" a
	${IfNot} ${Errors}
		FileSeek $9 0 END
		FileWrite $9 "${msg}$\r$\n"
		FileClose $9
	${EndIf}
	Pop $9
!macroend
!define Log "!insertmacro Log"
# ---------------------------------------------------------------------------

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

	# Move dbchanges.txt to logged-in user's AppData\Roaming\havmor
	# Only run this block if the source file actually exists, and only delete
	# the source after a successful copy (so we never lose the file).
	${Log} "[dbchanges] --- begin ---"
	${Log} "[dbchanges] INSTDIR=$INSTDIR"
	SetShellVarContext current
	${Log} "[dbchanges] APPDATA (current ctx)=$APPDATA"
	${If} ${FileExists} "$INSTDIR\resources\dbchanges.txt"
		${Log} "[dbchanges] source EXISTS at $INSTDIR\resources\dbchanges.txt"
		CreateDirectory "$APPDATA\havmor"
		${If} ${FileExists} "$APPDATA\havmor\*.*"
			${Log} "[dbchanges] target dir ready: $APPDATA\havmor"
		${Else}
			${Log} "[dbchanges] WARN target dir missing after CreateDirectory: $APPDATA\havmor"
		${EndIf}
		ClearErrors
		CopyFiles /SILENT "$INSTDIR\resources\dbchanges.txt" "$APPDATA\havmor\dbchanges.txt"
		${If} ${Errors}
			${Log} "[dbchanges] ERROR CopyFiles set the error flag"
		${EndIf}
		${If} ${FileExists} "$APPDATA\havmor\dbchanges.txt"
			${Log} "[dbchanges] copy verified at $APPDATA\havmor\dbchanges.txt"
		${Else}
			${Log} "[dbchanges] ERROR destination file NOT found after copy: $APPDATA\havmor\dbchanges.txt"
		${EndIf}
		${IfNot} ${Errors}
		${AndIf} ${FileExists} "$APPDATA\havmor\dbchanges.txt"
			Delete "$INSTDIR\resources\dbchanges.txt"
			${If} ${FileExists} "$INSTDIR\resources\dbchanges.txt"
				${Log} "[dbchanges] WARN source still exists after Delete"
			${Else}
				${Log} "[dbchanges] source removed from $INSTDIR\resources\"
			${EndIf}
		${Else}
			${Log} "[dbchanges] source kept (copy failed or destination missing)"
		${EndIf}
		AccessControl::GrantOnFile "$APPDATA\havmor" "(BU)" "FullAccess"
	${Else}
		${Log} "[dbchanges] source NOT found at $INSTDIR\resources\dbchanges.txt - skipping"
	${EndIf}
	SetShellVarContext all
	${Log} "[dbchanges] --- end ---"
	
  
!macroend


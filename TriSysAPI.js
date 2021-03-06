/* TriSys Web API Specific Javascript Code
*
* (c) 2010-2015 TriSys Business Software
*
* This code is public domain open source and is available on github at:
* https://github.com/TriSysBusinessSoftware/TriSys-API-JS
*
*/

// The TriSysAPI namespace
var TriSysAPI =
{
    // Copyright Notice
    Copyright:
    {
        AllRightsReserved: "TriSys Business Software"
    },

    //#region TriSysAPI.Data

    Data:
    {
        // Wrapper for all JQuery/Ajax calls so that we have centralised control.
        // We have found that POST is the most versatile HTTP verb.
        PostToWebAPI: function (payloadObject)
        {
            var bAsynchronous = true;
            var sURL = null;
            var sAPIurl = TriSysAPI.Data.BaseAddress();
            var dataPacketOutbound = null;
            var fDataPacketInboundFunction = null;  // function (data) { so something with data; }
            var fErrorHandlerFunction = null;       // function (request, status, error) { so something with data; }
            var sHTTPVerb = "POST";
            var sFunction = "TriSysAPI.Data.PostToWebAPI(): ";
            var bShowErrorAlert = true;

            if (payloadObject)
            {
                try
                {
                    if (!TriSysAPI.Operators.isEmpty(payloadObject.URL))
                        sURL = sAPIurl + payloadObject.URL;

                    if (!TriSysAPI.Operators.isEmpty(payloadObject.OutboundDataPacket))
                        dataPacketOutbound = payloadObject.OutboundDataPacket;

                    if (!TriSysAPI.Operators.isEmpty(payloadObject.InboundDataFunction))
                        fDataPacketInboundFunction = payloadObject.InboundDataFunction;

                    if (!TriSysAPI.Operators.isEmpty(payloadObject.ErrorHandlerFunction))
                    {
                        fErrorHandlerFunction = payloadObject.ErrorHandlerFunction;
                        bShowErrorAlert = false;
                    }

                    if (!TriSysAPI.Operators.isEmpty(payloadObject.Asynchronous))
                    {
                        bAsynchronous = payloadObject.Asynchronous;
                    }

                }
                catch (err)
                {
                    alert(sFunction + err.message);
                }
            }

            if (!sURL)
            {
                alert(sFunction + 'missing URL parameter.');
                return;
            }

            if (!fDataPacketInboundFunction)
            {
                alert(sFunction + 'missing inbound data function.');
                return;
            }

            // Browser compatibility to support legacy Internet Explorer
            //TriSysSDK.Browser.CORSProxyKludge();
            var bSupportsSynchronousAPI = true;

            if (!bAsynchronous)
            {
                if (bSupportsSynchronousAPI)
                {
                    // Turn off asynchronicity where calls must be synchronised
                    $.ajaxSetup({ async: false });
                }
                else
                {
                    // If we are unable to perform synchronous API calls (IE 6, 7, 8, 9), then return
                    fDataPacketInboundFunction("");
                    return;
                }
            }

            //alert('About to post $.ajax() to ' + sURL);

            $.ajaxSetup({
                accepts: {
                    xml: "application/xml, text/xml",
                    html: "text/html",
                    script: "text/javascript, application/javascript",
                    json: "application/json, text/javascript",
                    text: "text/plain",
                    // Hack for Chrome/Safari
                    _default: ""
                }
            });

            $.ajax({
                url: sURL,
                data: dataPacketOutbound,
                type: sHTTPVerb,
                dataType: 'json',

                crossDomain: true,
                cache: false,
                beforeSend: function (xhr)
                {
                    var sSiteKey = TriSysAPI.Session.DeveloperSiteKey();
                    xhr.setRequestHeader('SiteKey', sSiteKey);

                    var sDataServicesKey = TriSysAPI.Session.DataServicesKey();
                    if (!TriSysAPI.Operators.isEmpty(sDataServicesKey))
                        xhr.setRequestHeader('DataServicesKey', sDataServicesKey);
                },
                success: function (data)
                {
                    fDataPacketInboundFunction(data);
                },

                error: function (request, status, error)
                {
                    // Check error status because this error fires when AJAX requests
                    // are still in progress when we redirect to another page.
                    // If this is the case, do not report or log it as it is not needed.
                    var bReportError = false;
                    if (request.status != 0 || status != "error")
                        bReportError = true;

                    if (bReportError)
                    {
                        if (fErrorHandlerFunction)
                            fErrorHandlerFunction(request, status, error);

                        if (bShowErrorAlert)
                            TriSysApex.UI.ErrorHandlerRedirector(sFunction, request, status, error);
                    }
                }
            });


            if (!bAsynchronous)
            {
                // Turn on asynchronicity as this should be the default for all Ajax calls
                $.ajaxSetup({ async: true });
            }
        },

        BaseAddress: function ()
        {
            var sAPIurl = TriSysAPI.Constants.SecureURL;    // Note: Change to http://localhost:61333/ for testing API source code

            var bDebuggingAPIServerCode = false;

            if (bDebuggingAPIServerCode)
            {
                var sThisURL = window.location.href;
                try
                {
                    if (sThisURL.indexOf("http://localhost") === 0)
                        sAPIurl = '/';
                }
                catch (ex)
                {
                    alert('BaseAddress exception: ' + ex.message);
                }
            }

            return sAPIurl;
        },

        Version: function (fnCallback)
        {
            var payloadObject = {};
            payloadObject.URL = "Start/VersionNumber";

            if (!fnCallback)
                payloadObject.Asynchronous = false;

            var sVersion = null;

            payloadObject.InboundDataFunction = function (data)
            {
                sVersion = data;

                if (fnCallback)
                    fnCallback(sVersion);
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                alert('TriSysAPI.Data.Version: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);

            return sVersion;
        },

        IPAddress: function (bSupressError)
        {
            var payloadObject = {};
            payloadObject.URL = "Start/IPAddress";
            payloadObject.Asynchronous = false;

            var sIPAddress = null;

            payloadObject.InboundDataFunction = function (data)
            {
                sIPAddress = data;
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                if (TriSysAPI.Operators.isEmpty(bSupressError))
                    alert('TriSysAPI.Data.IPAddress: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);

            return sIPAddress;
        },

        VerifyDataServicesKey: function ()
        {
            var bSupportsSynchronousAPI = true;
            if (!bSupportsSynchronousAPI)
            {
                var sDataServicesKey = TriSysAPI.Session.DataServicesKey();
                if (!TriSysAPI.Operators.isEmpty(sDataServicesKey))
                    return true;
                else
                    return false;
            }

            var payloadObject = {};
            payloadObject.URL = "Security/VerifyDataServicesKey";
            payloadObject.Asynchronous = false;

            var bVerified = false;

            payloadObject.InboundDataFunction = function (data)
            {
                if (data)
                    bVerified = data.Success;
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                //alert('TriSysAPI.Data.VerifyDataServicesKey: ' + status + ": " + error + ". responseText: " + request.responseText);
                // We are not connected or something has gone wrong
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);

            return bVerified;
        }
    },
    //#endregion TriSysAPI.Data

    //#region TriSysAPI.Session

    Session:
    {
        // These are held in memory only
        DeveloperSiteKey: function ()
        {
            var s = TriSysAPI.Session.Memory.Get("DeveloperSiteKey");
            return s;
        },

        SetDeveloperSiteKey: function (sKey)
        {
            TriSysAPI.Session.Memory.Set("DeveloperSiteKey", sKey, 1);
        },

        SetDataServicesKey: function (sKey)
        {
            TriSysAPI.Session.Memory.Set("DataServicesKey", sKey, 1);
        },

        DataServicesKey: function ()
        {
            try
            {
                var s = TriSysAPI.Session.Memory.Get("DataServicesKey");
                return s;
            }
            catch (ex)
            {
                // Ignore 'not found'
                return null;
            }
        },

        // These are held in cookies on the machine
        Password: function ()
        {
            // Stored in cookies
            var s = TriSysAPI.Cookies.getCookie('Password');
            return s;
        },
        SetPassword: function (s)
        {
            TriSysAPI.Cookies.setCookie('Password', s, 1);
        },
        SaveLoginCredentials: function ()
        {
            // Stored in cookies
            var s = TriSysAPI.Cookies.getCookie('SaveLoginCredentials');
            var b = TriSysAPI.Operators.stringToBoolean(s, false);
            return b;
        },
        SetSaveLoginCredentials: function (b)
        {
            // Store in cookies
            TriSysAPI.Cookies.setCookie('SaveLoginCredentials', b, 1);
        },

        // 22 Sep 2014: Are we connected to service API?
        isConnected: function ()
        {
            var bSupportsSynchronousAPI = true;
            if (bSupportsSynchronousAPI)
            {
                var sIPAddress = TriSysAPI.Data.IPAddress();
                if (!TriSysAPI.Operators.isEmpty(sIPAddress))
                {
                    if (sIPAddress.length >= 7)     // 1.1.1.1
                        return true;
                }
            }
            else
            {
                // Have to assume another mechanism - check for a data services key
                var sDataServicesKey = TriSysAPI.Session.DataServicesKey();
                if (!TriSysAPI.Operators.isEmpty(sDataServicesKey))
                    return true;
            }
            return false;
        },


        // 23 July 2014: Code lifted from http://www.sitepoint.com/blogs/2009/09/03/javascript-session-variable-library
        // to provide us with proper session based storage rather than persistent.
        // This is much more secure and harder to crack.
        // Note how I have used additional brackets on function declaration to allow using code to NOT have to use ()?
        /*
         * Usage:
         *
         * // store a session value/object
         * TriSysAPI.Session.Memory.Set(name, object);
         *
         * // retreive a session value/object
         * TriSysAPI.Session.Memory.Get(name);
         *
         * // clear all session data
         * TriSysAPI.Session.Memory.Clear();
         *
         * // dump session data
         * TriSysAPI.Session.Memory.Dump();
         */

        Memory: (function ()      // TriSysAPI.Session.Memory
        {
            // window object
            var win = null;

            try
            {
                win = window.top || window;
            }
            catch (err)
            {
                // Cross domain friendly written to help us manage mobile device testing on http://mobiletest.me
                win = {};


                // Cross-domain problem
                //alert("Cross domain bug #1");
                //return null;
            }


            // session store
            var store = null;

            try
            {
                store = (win.name ? JSON.parse(win.name) : {});
            }
            catch (err)
            {
                // Cross domain friendly written to help us manage mobile device testing on http://mobiletest.me
                store = {};


                // Cross-domain problem
                //alert("Cross domain bug #2");
                //return null;
            }

            // save store on page unload
            function Save()
            {
                win.name = JSON.stringify(store);
            };

            // page unload event
            if (window.addEventListener) window.addEventListener("unload", Save, false);
            else if (window.attachEvent) window.attachEvent("onunload", Save);
            else window.onunload = Save;

            // public methods
            return {

                // set a session variable
                Set: function (name, value)
                {
                    store[name] = value;
                },

                // get a session value
                Get: function (name)
                {
                    return (store[name] ? store[name] : null);
                },

                // clear session
                Clear: function () { store = {}; },

                // dump session data
                Dump: function () { return JSON.stringify(store); }
            };
        })()

    },
    //#endregion TriSysAPI.Session

    //#region TriSysAPI.Cookies

    Cookies:
    {
        //CookiePrefix: 'TriSysAPI_',

        setCookie: function (c_name, value, exdays)
        {

            //c_name = TriSysAPI.Cookies.CookiePrefix + c_name;

            try
            {
                // PhoneGap Compatible!
                window.localStorage.setItem(c_name, value);
                return;

                // Browser cookies
                var exdate = new Date();
                exdate.setDate(exdate.getDate() + exdays);
                var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
                document.cookie = c_name + "=" + c_value;
            }
            catch (err)
            {
                console.log('setCookie error: ' + c_name + ", " + err.message);
            }
        },

        getCookie: function (c_name)
        {

            //c_name = TriSysAPI.Cookies.CookiePrefix + c_name;

            //alert('getCookie: ' + c_name);

            try
            {
                // PhoneGap Compatible!
                var value = window.localStorage.getItem(c_name);
                return value;

                // Browser cookies
                var c_value = document.cookie;
                var c_start = c_value.indexOf(" " + c_name + "=");
                if (c_start == -1)
                {
                    c_start = c_value.indexOf(c_name + "=");
                }
                if (c_start == -1)
                {
                    c_value = null;
                }
                else
                {
                    c_start = c_value.indexOf("=", c_start) + 1;
                    var c_end = c_value.indexOf(";", c_start);
                    if (c_end == -1)
                    {
                        c_end = c_value.length;
                    }
                    c_value = unescape(c_value.substring(c_start, c_end));
                }

                var sDisplay = c_value;
                if (sDisplay)
                    sDisplay = sDisplay.substring(0, 50) + '...';

                alert('getCookie(' + c_name + ') = \n ' + sDisplay);
                return c_value;
            }
            catch (err)
            {
                // Oops!
                console.log('getCookie error: ' + err.message);
            }

        },

        Clear: function ()
        {
            try
            {
                window.localStorage.clear();
            }
            catch (e)
            {

            }
        },

        Delete: function (sCookieName)
        {
            try
            {
                window.localStorage.removeItem(sCookieName);
            }
            catch (err)
            {

            }
        }
    },

    //#endregion TriSysAPI.Cookies

    //#region TriSysAPI.Persistence
    Persistence:
    {
        Read: function (sObjectName)
        {
            var sObjectString = TriSysAPI.Cookies.getCookie(sObjectName);
            if (sObjectString)
            {
                // Convert from a string to the native JSON object
                return JSON.parse(sObjectString);
            }
        },

        Write: function (sObjectName, object)
        {
            // Cache as a cookie
            var sObjectString = JSON.stringify(object);
            TriSysAPI.Cookies.setCookie(sObjectName, sObjectString);
        }
    },
    //#endregion TriSysAPI.Persistence

    //#region TriSysAPI.Operators

    Operators:
    {
        isEmpty: function (obj)
        {

            try
            {
                if (
                    obj === "" ||
                    obj === null ||
                    obj === "NULL" ||
                    obj === undefined //|| obj === false || obj === 0 || obj === "0" ||
                )
                {
                    return true;
                }

                if (typeof (obj) === 'object')
                {
                    var i = 0;
                    for (key in obj)
                    {
                        i++;
                    }
                    if (i === 0) { return true; }
                }
                return false;
            }
            catch (err)
            {
            }

            return true;
        },

        stringToBoolean: function (str, bDefault)
        {
            if (!TriSysAPI.Operators.isEmpty(str))
            {
                try
                {
                    if (typeof str === 'string')
                    {
                        switch (str.toLowerCase())
                        {
                            case "true": case "yes": case "1": return true;
                            case "false": case "no": case "0": case null: return false;
                            default: return Boolean(str);
                        }
                    }
                    else
                        return str;
                }
                catch (err)
                {
                }
            }

            return bDefault;
        },

        booleanToString: function (b)
        {
            try
            {
                if (b)
                    return 'true';
                else
                    return 'false';
            }
            catch (ex)
            {
                return false;
            }
        }

    },
    //#endregion TriSysAPI.Operators

    //#region TriSysAPI.TriSysForWebsites
    TriSysForWebsites:
    {
        // The public API key identifying the application welded server resources
        // This points to a demonstration database only
        APIKey: '20131219-ba09-4e4c-8bcb-jsfiddle____',

        TriSysCRMCredentialAccountTypeEnum:
        {
            AgencyClientOrCandidate: 2,
            AgencyVacanciesOnly: 3
        },

        DemonstrationCredentials:
        {
            // This key is generated by TriSys Business Software to match the TriSys Customer in CRM who is welded to the recruitment agency database and API Key
            AgencyUserLoginCredentialsToCRM: 'f7lpe1db-zkl4-7ce1-nbfo-qwvucd8c84ej',

            AgencyVacancyDataServicesKey: '8675e1db-9dd4-4134-8bf2-9d57ce1914e8',

            ClientEMail: 'charles@serentis.co',
            ClientPassword: 'sql',

            CandidateEMail: 'betsy@palmer.com',
            CandidatePassword: 'sql'
        },

        // Connect to Web Service to obtain a data services key.
        // Can log in as either the default 'vacancies only' or a candidate, or a client.
        // Callback after success to allow data to be retrieved.
        Authenticate: function (validateCallbackFunction, bCandidate, bClient)
        {
            TriSysAPI.Session.SetDeveloperSiteKey(TriSysAPI.TriSysForWebsites.APIKey);

            var CSecurityControllerAuthenticateTriSysCRMCredentials = {
                CRMCredentialKey: TriSysAPI.TriSysForWebsites.DemonstrationCredentials.AgencyUserLoginCredentialsToCRM,
                AccountType: TriSysAPI.TriSysForWebsites.TriSysCRMCredentialAccountTypeEnum.AgencyVacanciesOnly
            };

            if (bCandidate)
            {
                CSecurityControllerAuthenticateTriSysCRMCredentials.AgencyContact_EMail = TriSysAPI.TriSysForWebsites.DemonstrationCredentials.CandidateEMail;
                CSecurityControllerAuthenticateTriSysCRMCredentials.AgencyContact_Password = TriSysAPI.TriSysForWebsites.DemonstrationCredentials.CandidatePassword;
                CSecurityControllerAuthenticateTriSysCRMCredentials.AccountType = TriSysAPI.TriSysForWebsites.TriSysCRMCredentialAccountTypeEnum.AgencyClientOrCandidate;
            }
            else if (bClient)
            {
                CSecurityControllerAuthenticateTriSysCRMCredentials.AgencyContact_EMail = TriSysAPI.TriSysForWebsites.DemonstrationCredentials.ClientEMail;
                CSecurityControllerAuthenticateTriSysCRMCredentials.AgencyContact_Password = TriSysAPI.TriSysForWebsites.DemonstrationCredentials.ClientPassword;
                CSecurityControllerAuthenticateTriSysCRMCredentials.AccountType = TriSysAPI.TriSysForWebsites.TriSysCRMCredentialAccountTypeEnum.AgencyClientOrCandidate;
            }


            var payloadObject = {};

            payloadObject.URL = "Security/AuthenticateTriSysCRMCredentials";

            payloadObject.OutboundDataPacket = CSecurityControllerAuthenticateTriSysCRMCredentials;

            payloadObject.InboundDataFunction = function (data)
            {
                var sDataServicesKey = data, bAuthenticated = false;

                if (sDataServicesKey && sDataServicesKey.length > 0)
                {
                    // Record in session state
                    TriSysAPI.Session.SetDataServicesKey(sDataServicesKey);
                    bAuthenticated = true;
                }

                // Call back now with status
                validateCallbackFunction(bAuthenticated);
            };

            payloadObject.ErrorHandlerFunction = function (request, status, error)
            {
                alert('TriSysAPI.TriSysForWebsites.Authenticate: ' + status + ": " + error + ". responseText: " + request.responseText);
            };

            TriSysAPI.Data.PostToWebAPI(payloadObject);

            return true;
        },

        UploadFiles: function (files, fnCallback)
        {
            if (!files)
                return;

            var formData = new FormData();
            for (var i = 0; i < files.length; i++)
            {
                var trisysFile = files[i];
                formData.append("trisysFile", trisysFile);
            }

            $.ajax({
                type: "POST",
                url: "https://api.trisys.co.uk/files/uploadfile",
                contentType: false,
                processData: false,
                data: formData,
                cache: false,
                crossDomain: true,
                beforeSend: function (xhr)
                {
                    xhr.setRequestHeader('SiteKey', TriSysAPI.Session.DeveloperSiteKey());

                    var sDataServicesKey = TriSysAPI.Session.DataServicesKey();
                    if (!TriSysAPI.Operators.isEmpty(sDataServicesKey))
                        xhr.setRequestHeader('DataServicesKey', sDataServicesKey);
                },
                success: function (result)
                {
                    var uploadedFiles = [];
                    for (var i = 0; i < result.length; i++)
                    {
                        var sFile = result[i];
                        uploadedFiles.push(sFile);
                    }
                    fnCallback(uploadedFiles);
                },

                error: function (request, status, error)
                {
                    alert("TriSysAPI.TriSysForWebsites.UploadFiles: " + request + status + error);
                }
            });
        },

        GetFileNameFromPath: function (sPath)
        {
            var slashes = ["/", "\\"], sName = null;
            $.each(slashes, function (index, sSlash)
            {
                var i = sPath.lastIndexOf(sSlash);
                if (i > 0)
                {
                    sName = sPath.substring(i + 1);
                }
            });

            return sName;
        }
    },
    //#endregion TriSysAPI.TriSysForWebsites

    //#region TriSysAPI.Constants
    Constants:
    {
        SecureURL: 'https://api.trisys.co.uk/',         //    SECURE VERSION
        UploadURL: 'https://api.trisys.co.uk/upload/'
    }
    //#endregion TriSysAPI.Constants
};

const { spawn } = require('child_process');
const path = require('path')

module.exports = {
    parseAllHr: parseAllHr,
    parserWithML: parserWithML
};

function parseAllHr(originalText,textLowerCase, textarrNewLine, targetPath, filename, totalVal, cb) {
   
    return new Promise((resolve, reject) => {
        var longnumber = '',
        dateForYear = new Date(),
        yearForYear = dateForYear.getFullYear();
        yearForYear = yearForYear + '';
        var CurrentYearArr = [yearForYear, yearForYear[0] + 'k' + yearForYear.slice(2, 3),
        yearForYear.slice(2, 3), "'" + yearForYear.slice(2, 3)
    ],
    textarr = [];
    textarrNewLine.map(function(eachElement) {
        var array = eachElement.split(' ');
        array.map(function(element) {
            element = element.replace(/ /g, '');
            if (element != '') textarr.push(element.trim());
        });
    });
    var targetPathArr = targetPath.split('/');
    var nameFromFile = targetPathArr[targetPathArr.length - 1];
    nameFromFile = nameFromFile.split('.');
    nameFromFile.pop();
    nameFromFile = nameFromFile.join('.');
    var FresherFlag = false;
    
    if(nameFromFile.indexOf('_') > -1) {
        var index= nameFromFile.indexOf('_');
        nameFromFile = nameFromFile.substring(0, index);
    }
    
    if(nameFromFile.indexOf('-') > -1) {
        var index= nameFromFile.indexOf('-');
        nameFromFile = nameFromFile.substring(0, index);
    }
    
    nameFromFile = nameFromFile.split(' ').slice(0,2).join(' ');  
    
    var nameFromFile = nameFromFile.toLowerCase().replace(/,/g, ' ').replace(/-/g, ' ').replace(/:/g, ' ').replace(/\n/g, ' ').replace(/\./g, ' ').replace(/ +/g, ' ').replace(/\+/g, ' ').replace("(", " ").replace(")", " ").replace(/_/g, ' ').replace(/\d/g, ' ').replace(/]/g, ' ').replace(/[\[\]']+/g, ' ').replace(/'/, ' ').replace(/"/, ' ');
    while (nameFromFile.indexOf("(") != -1 || nameFromFile.indexOf(")") != -1) nameFromFile = nameFromFile.replace("(", '').replace(")", '');
    if (nameFromFile.indexOf('fresher') != -1 || nameFromFile.indexOf('freshr') != -1) {
        FresherFlag = true;
    }
    
    var nameArrForFile = [];
    nameArrForFile.push(filename);
    var Qualification = totalVal.qualificationFromDb,
        QualificationId= totalVal.qualificationIdFromDb,
        numberGrid = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'],
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];;
        // skillsfromdb = totalVal.skillsfromdb,
        // skillsIdfromdb = totalVal.skillsfromdb,
        skillsIdfromdb = totalVal.skillsIdfromdb,
        institituefromdb = totalVal.institituefromdb,
        instititueIdfromdb = totalVal.instititueIdfromdb,
        location = totalVal.location,
        locationId = totalVal.locationId,
        name = '',
        email = '',
        phone = '',
        skillarr = [],
        skillarrId = [],
        skillarrText = [],
        qualIndex = -1,
        allLocationInResume = [],
        currentlocation = -1,
        instititutes = '',
        institituteName = '',
        permanentAddress = '',
        permanentAddress2 = '',
        years = 0,
        months = 0,
        addressIndexForName = [],
        nameExclusionsSess = [],
        emailArr = [],
        exclusionWords=['fresher','resume','eol','copy','com','updated','fwd','fwd:_applicant resume received ','applicant resume received'],
        loc=[],
        qual=[],othersIndexQual='';
        
        /**********************Skills***********************************/
        
        // skillsfromdb.forEach(function(element, index) {
            //     var startIndex = 0,
            //         elementFlag = true;
            //     while (textLowerCase.indexOf(element, startIndex) != -1 && elementFlag) {
                //         var textindex = textLowerCase.indexOf(element, startIndex);
                //         startIndex = textindex;

                //         if (textLowerCase[textindex - 1] == ' ' && (textLowerCase[textindex + element.length] == ' ' || textLowerCase[textindex + element.length] == '.')) { //After skills could be a full stop
                //             // console.log("skillsfromdb[index]",skillsfromdb[index]);       
                //             skillarrId.push(skillsIdfromdb[index]);
                //             skillarrText.push(skillsfromdb[index]);
                //             elementFlag = false;
                //         } else startIndex++;
                //     }
                // });
                
                // textLowerCase = textLowerCase.replace(/\./g, ''); //I need dot(.)  for skills like .net
                // console.log("textLowerCcccccaseeee",textLowerCase);
                
                /***********************Institute*************************************/
                for (var i = 0; i < institituefromdb.length; i++) {
                    if (textLowerCase.indexOf(institituefromdb[i]) != -1) {
                        // console.log("institituefromdbbbbbb",institituefromdb[i]);
                        var textindex = textLowerCase.indexOf(institituefromdb[i]);
                        if (textLowerCase[textindex - 1] == ' ' && textLowerCase[textindex + institituefromdb[i].length] == ' ') {
                            instititutes = institituefromdb[i];
                // console.log("instititutesssss",instititutes);
                break;
            }

        }
    }
    
    /**********************Location*********************************/
    for (var i = 0; i < location.length; i++) {
        if (textLowerCase.indexOf(location[i]) != -1) {
            var textindex = textLowerCase.indexOf(location[i]);
            if (textLowerCase[textindex - 1] == ' ' && textLowerCase[textindex + location[i].length] == ' ') {
                allLocationInResume.push(locationId[i]);
                
            }
        }
        
    }
    if (allLocationInResume.length) {
        currentlocation = allLocationInResume[0];
        
    }
    /******************************To improve the efficiency of name*****************************************/
    var nameflag = true;
    var kIncName = 0;
    var countName = 0;
    while (textarr[kIncName] == 'EOL' && textarr.length > kIncName) kIncName++;
    while (nameflag && textarr.length > kIncName) {
        try {
            if (textarr[kIncName].toLowerCase() == 'name') {
                var kinc = 2;
                while (textarr[kIncName + kinc] == 'EOL') kinc++;
                name = textarr[kIncName + 1] + ' ' + textarr[kIncName + kinc];
            }
        } catch (err) {
            return;
        }
        
        if (textarr[kIncName] == 'EOL') {
            countName++;
        }
        
        if (countName == 3) nameflag = false;
        
        kIncName++;

    }
    /************Name From File and large Array For Name*******************/
    if (name.trim() == '') {
        var largeArrayForNameFromFile = allLocationInResume.concat(nameArrForFile).concat(Qualification);
        var skillArrForName = [];
        var currIndex = 0;
        skillarrId.forEach(function(element, index) {
            currIndex = skillsIdfromdb.indexOf(element);
            while (skillsIdfromdb[currIndex] == element && currIndex < skillsIdfromdb.length) {
                skillArrForName.push(skillsfromdb[currIndex]);
                currIndex++;
            }
        });
        
        
        largeArrayForNameFromFile = largeArrayForNameFromFile.concat(skillArrForName);
        largeArrayForNameFromFile.sort(function(a, b) {
            return b.length - a.length; // ASC -> a - b; DESC -> b - a
        });
        
        var nameFromFileArr;
        var nameFromFileArr2 = [];
        nameFromFile = nameFromFile.replace(/ +/g, ' ');
        nameFromFileArr = nameFromFile.split(' ');
        
        nameFromFileArr.map(item=>{
            (item.length > 2 && item.indexOf('@') == -1) && nameFromFileArr2.push(item);
        });
        
        var newNameFromFile = [];
        var incrementerFor3 = 0
        nameFromFile = nameFromFileArr2.join(' ');
        name = nameFromFile.trim();
    }

    /**************Name From Text and large Array For Name********************/
    if (name.trim() == '') {
        var nameArrForText = nameExclusionsSess;
        var largeArrayForNameFromText = allLocationInResume.concat(nameArrForText).concat(Qualification).concat(skillArrForName);
    }
    
    var longNumber = '',
    phoneLongnumber = '';
    
    /***************To pick and parse individual words**********************/
    
    for (var k = 0; k < textarr.length; k++) {
        // console.log("111111111=>>>>>>>>...",textarr);
        (/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))+(\.)?$/.test(textarr[k])) && (email == '') && (email = textarr[k]);
        
        (/^\d{10,}$/.test(textarr[k])) && (phone = phone != '' ? phone + ',' + textarr[k] : textarr[k]);
        
        (/^\d{2,9}$/.test(textarr[k])) && ((longNumber == '' && textarr[k].slice(0, 2) != '20' || longNumber != '') && (longNumber = longNumber.concat(textarr[k])))
        
        if (longNumber.length >= 10 && !(/^\d{2,9}$/.test(textarr[k])) && phone.indexOf(longNumber) == -1) {
            phone = (phone != '') ? (phone + ',' + longNumber) : longNumber;
            longNumber = '';
        } else if (!(/^\d{2,9}$/.test(textarr[k]))) {
            longNumber = '';
        }

        if (textarr[k].toLowerCase() == 'address' && permanentAddress2 == '') {
            // console.log("textarrkkkk",textarr[k],textarr[k-1]);
            var k1 = k - 1;
            if (k == 0) k1 = 0;
            if(textarr[k - 1]){
                var text=textarr[k - 1].toLowerCase().replace(/['"]+/g, '');
            }else{
                var text=textarr[k].toLowerCase().replace(/['"]+/g, '');
            }
            if (text != 'virtual' && text != 'email') {
                var kIncAddress = k + 1;
                addressIndexForName.push(kIncAddress);
                while (isSuitableAdd(kIncAddress, allLocationInResume, textarr) && kIncAddress < textarr.length - 1) {
                    permanentAddress2 = permanentAddress2.concat(textarr[kIncAddress]).concat(' ');
                    kIncAddress++;
                }
                addressIndexForName.push(kIncAddress);
                permanentAddress2 = permanentAddress2.concat(textarr[kIncAddress])
                permanentAddress2 = permanentAddress2.replace(/EOL/g, '');
                permanentAddress2=permanentAddress2.split('  ');
                permanentAddress2=permanentAddress2[0].replace(/['"]+/g, '').trim();
            }
            
        }
        
        if (/^[1-9]{1}\d{5}$/.test(textarr[k]) && permanentAddress == '') {
            
            while (textarr[k - 1] == 'EOL') k = k - 1;
            if (textarr[k - 1].toLowerCase() == 'code') k = k - 2;
            if (textarr[k - 1].toLowerCase() == 'pincode' || textarr[k - 1].toLowerCase() == 'pin') k = k - 1;
            while (textarr[k - 1] == 'EOL') k = k - 1;
            if (textarr[k - 1].length <= 2) {
                if (textarr[k - 2].toLowerCase() == 'nagar' || textarr[k - 2].toLowerCase() == 'pradesh' || textarr[k - 2].toLowerCase() == 'garh' || textarr[k - 2].toLowerCase() == 'nadu') {
                    while (textarr[k - 1] == 'EOL') k = k - 1;
                    permanentAddress = textarr[k - 3] + ' ' + textarr[k - 2];
                } else {
                    while (textarr[k - 1] == 'EOL') k = k - 1;
                    permanentAddress = textarr[k - 2];
                }
            } else {
                while (textarr[k - 1] == 'EOL') k = k - 1;
                if (textarr[k - 1].toLowerCase() == 'nagar' || textarr[k - 1].toLowerCase() == 'pradesh' || textarr[k - 1].toLowerCase() == 'garh' || textarr[k - 1].toLowerCase() == 'nadu') {
                    while (textarr[k - 1] == 'EOL') k = k - 1;
                    permanentAddress = textarr[k - 2] + ' ' + textarr[k - 1];
                } else {
                    while (textarr[k - 1] == 'EOL') k = k - 1;
                    permanentAddress = textarr[k - 1];
                }
            }
        }

        if (((/month/i).test(textarr[k]) || (/mnth/i).test(textarr[k])) && months == 0 && !(/period/i).test(textarr[k-2])  ) {
            // console.log("month",textarr[k],textarr[k-2]);
            if ((/\d{1,2}/gi).test(textarr[k - 1]) || numberGrid.indexOf(textarr[k - 1].toLowerCase()) != -1) {
                var demoMonths = [];
                demoMonths.push(parseInt(textarr[k - 1]));
                months = demoMonths.reduce(function(a, b) { return a + b; }, 0);
                // console.log("demomonthssss",demoMonths,"monthsss",months);
            }
        }
        
        if ((/^year/i).test(textarr[k]) || (/^yr/i).test(textarr[k]) && years == 0  && !(/period/i).test(textarr[k-2]) ) {
            if ((/^\d+(\.\d{1,4})?$/i).test(textarr[k - 1]) || numberGrid.indexOf(textarr[k - 1].toLowerCase()) != -1) {
                years = textarr[k - 1];
                // console.log("yearssss",years);
                var j = k;
                while (textarr[j].indexOf('EOL') != -1) {
                    if ((/month/i).test(textarr[j]) || (/mnth/i).test(textarr[j])) {
                        if ((/\d{1,2}/gi).test(textarr[j - 1]) || numberGrid.indexOf(textarr[j - 1].toLowerCase()) != -1) {
                            months = textarr[j - 1];
                            // console.log("monnthhssss",months);
                        }
                    }
                    j++;
                }
            }
        }
        

        //code for picking experience from carrier objective
        
        // for(i=0;i<227;i++){
            //     if ((/^year/i).test(textarr[i]) || (/^yr/i).test(textarr[i])  && !(/period/i).test(textarr[i-2]) ) {
                //         if ((/^\d+(\.\d{1,4})?$/i).test(textarr[i - 1]) || numberGrid.indexOf(textarr[i - 1].toLowerCase()) != -1) {
                    //             years = textarr[i - 1];
                    //             // console.log("yearssss",years);
        //             var j = i;
        //             while (textarr[j].indexOf('EOL') != -1) {
            //                 if ((/month/i).test(textarr[j]) || (/mnth/i).test(textarr[j])) {
                //                     if ((/\d{1,2}/gi).test(textarr[j - 1]) || numberGrid.indexOf(textarr[j - 1].toLowerCase()) != -1) {
                    //                         months = textarr[j - 1];
                    //                         console.log("monthssss11",months);
                    //                     }
                    //                 }
                    //                 j++;
                    //             }
                    //         }
                    //     }
                    //     if (((/month/i).test(textarr[i]) || (/mnth/i).test(textarr[i])) && !(/period/i).test(textarr[i-2])  ) {
                        //         // console.log("month",textarr[k],textarr[i-2]);
                        //         if ((/\d{1,2}/gi).test(textarr[i - 1]) || numberGrid.indexOf(textarr[i - 1].toLowerCase()) != -1) {
        //             months = textarr[i - 1];
        //             console.log("monthssss",months);
        //         }
        //     }
        // }
        
    }
    
    var emailDotless = email.replace(/\./g, '');
    if (emailArr.indexOf(emailDotless) != -1 && email != '') {
        return;
    } else {
        emailArr.push(emailDotless);
    }
    
    var kIncNameNew = 0;
    /********************Name from text****************************/
    while (kIncNameNew < 50 && name == '' && kIncNameNew < textarr.length - 2) {
        (ifSuitableName(kIncNameNew, textarr, addressIndexForName, largeArrayForNameFromText) && ifSuitableName(kIncNameNew + 1, textarr, addressIndexForName, largeArrayForNameFromText)) && 
        (name = textarr[kIncNameNew] + ' ' + textarr[kIncNameNew + 1]);
        kIncNameNew++;
    }
    
    exclusionWords.map(item=>{
        if(name.toLowerCase().indexOf(item) > -1) {
            var index= name.indexOf(item);
            name = name.substring(0, index);
            name = name.split(' ').slice(0,2).join(' ');
        }
    });
    
    (phone == '' && phoneLongnumber != '') && (phone = phoneLongnumber);
    (numberGrid.indexOf(years) != -1) && (years = numberGrid.indexOf(years) + 1);
    
    (numberGrid.indexOf(months) != -1) && (months = numberGrid.indexOf(months) + 1);
    (permanentAddress2 != '') && (permanentAddress = permanentAddress2);
    
    //changes to get years without month
    
    if ((/^\d+(\.\d{1,4})$/i).test(years)) {
        // console.log("yearsAndMonthssss",years,months);
        var value = years.split('.');
        // console.log("valueeee",value);
        // value[1] = (value[1] / (10 * (value[1].length))) * 12;
        months = parseInt(value[1])+parseInt(months);
        years = parseInt(value[0]);
        // console.log("yearsAndMonth",years,months);
    }
    // else{
        //     console.log("yearsAndMonthsssseellsseee",years,months);
        // }
        
        if (months >= 12) {
            years = years + parseInt(months / 12);
            months = months % 12;
        }
        
        months = parseInt(months);  
        if (FresherFlag) {
            years = '-1';
        months = '-1';
    }
    skillarrId = skillarrId.join(',');
    skillarrText = skillarrText.join(',');
    
    years = years + '';
    months = months + '';
    //(skillarrId == '') && (skillarrId = '0');
    years = isNaN(years) ? 0 : (years.toString().length > 2 ? 0 : years);
    months = isNaN(months) ? 0 : (months.toString().length > 2 ? 0 : months);
    location.map((item, i)=>{
        var index=permanentAddress.toLowerCase().indexOf(item.toLowerCase());
        if (index > -1) {
            loc.push(locationId[i]);
        }        
    });
    currentlocation=loc.length ? loc[0] : '';
    Qualification.map((element, index)=> {
        if (originalText.toLowerCase().indexOf(element.toLowerCase()) > -1) {
            var qIndex=Qualification.indexOf(element);
            qual.push(QualificationId[qIndex]);
        }
    });
    othersIndexQual=Qualification.indexOf('Others') > -1 ? Qualification.indexOf('Others') :'Others';
    othersIndexInst=(institituefromdb.indexOf('Others') > -1) ? (institituefromdb.indexOf('Others')) :'Others';
    if(!email) {
        var emails = extractEmails (originalText.toLowerCase());
        if(emails){
            email=emails.join(',');
        }
    }
    if(!phone) {
        var phones = extractPhone (originalText.toLowerCase());
        if(phones){
            phone=phones.join(',');
        }        
    }   
    // console.log("yyyyyyyyyyyy",originalText); 
    var result = {
        name:  capitalize(name) ,
        email: email,
        phone:  phone,
        skillarrId: skillarrId,
        skillarrText:skillarrText,
        permanentAddress: permanentAddress,
        Qualification: qual.toString() || QualificationId[othersIndexQual],
        currentlocation: currentlocation,
        years: years,
        months: months,
        instititutes: instititutes || instititueIdfromdb[othersIndexInst],
        institituteName: instititutes || institituefromdb[othersIndexInst]
        
    };
    var textToModel = originalText.replace(/\n/g,' ');
    //console.log('TEXT TO PARSER------>>>>>',textToModel);
    parserWithML(textToModel)
    .then((data) => {
            result.name = result.name || capitalize(data.candidatename)
            result.phone = result.phone || data.phone

            console.log('------------------PARSED DATA WITH MACHINE LEARNING--------------------',data)
            resolve(result);
    })
    .catch((error) => {
        console.log("ERRRORRR FROMMM PARSER----->>>>>",error)
        resolve(result);
    });
}); 
}

function isSuitableAdd(cCounter, allLocationInResume, textarr) {

    var countAddr = 0;
    var locationFlag = true;
    if (textarr[cCounter] == undefined)
        return false;


    for (var i = 0; i < allLocationInResume.length; i++) {
        if (textarr[cCounter].toLowerCase() == location[parseInt(allLocationInResume[i])] && !/^[1-9]{1}\d{5}$/.test(textarr[cCounter + 1])) {
            locationFlag = false;
            break;
        }
    }
    if (!locationFlag) {
        return false;
    }

    if (/^[1-9]{1}\d{5}$/.test(textarr[cCounter]))
        return false;

    countAddr++;
    if (countAddr >= 25) {
        return false
    }

    return true;
}

function ifSuitableName(cCounter, textarr, addressIndexForName, largeArrayForNameFromText) {
    var wordLength = [],
        countForWordLength = 0,
        lArrFlag = true;
    wordLength[cCounter] = textarr[cCounter].length;
    var indexVar = ((textarr[cCounter].search(/\d/) != -1) || (textarr[cCounter].indexOf('_') != -1) || (textarr[cCounter].indexOf('-') != -1) || (textarr[cCounter].indexOf('@') != -1))
    if (indexVar)
        return false;
    if (wordLength[cCounter] < 3)
        countForWordLength++;
    else
        countForWordLength = 0;
    if (countForWordLength >= 2) {
        countForWordLength = 0;
        return false
    }

    if (addressIndexForName.length > 0) {
        if (addressIndexForName[0] <= cCounter && cCounter <= addressIndexForName[1]) {
            return false;
        }

    }
    return true;
}

function capitalize(string) {
    string = String(string);
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
function extractEmails ( text ){
    return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}
function extractPhone ( text ){
    return text.match(/[\+]?\d{10}|\(\d{3}\)\s?\d{6}/gi);
}

function parserWithML(text){

    return new Promise((resolve,reject) => {

        let parsedData = ''
        //creating a child process to run script
        let pythonScriptPath = path.join(__dirname,'../parser.py')
        const python = spawn('python3',[pythonScriptPath,text]);
        python.stdout.on('data',(data) => {
            parsedData = data.toString();
        })
    
        python.stderr.on('data',(error) => {
            console.log('ERRRORRR',error.toString())
            reject(error.toString())
        })
    
        python.on('close',( ) => {
            return resolve(parsedData);
            // return resolve(JSON.parse(parsedData));
        })
    });

}
const xlsx = require("xlsx");
const _ = require('lodash');

module.exports = {

  getExcelData: (filepath) => {
    return new Promise((resolve, reject) => {
      const x = ['departmentname', 'designationname', 'username', 'gradename'],
        errb = [], errbt = [], errtemp = [], errusr = [], errbill = [],
        wb = xlsx.readFile(filepath),
        ws = wb.Sheets["data"],
        data = xlsx.utils.sheet_to_json(ws),
        c1 = ws["A1"] ? ws["A1"].v && ws["A1"].v.toString().trim() : undefined,
        c2 = ws["B1"] ? ws["B1"].v && ws["B1"].v.toString().trim() : undefined,
        c3 = ws["C1"] ? ws["C1"].v && ws["C1"].v.toString().trim() : undefined,
        c4 = ws["D1"] ? ws["D1"].v && ws["D1"].v.toString().trim() : undefined,
        c5 = ws["E1"] ? ws["E1"].v && ws["E1"].v.toString().trim() : undefined,
        c6 = ws["F1"] ? ws["F1"].v && ws["F1"].v.toString().trim() : undefined,
        c7 = ws["G1"] ? ws["G1"].v && ws["G1"].v.toString().trim() : undefined,
        c8 = ws["H1"] ? ws["H1"].v && ws["H1"].v.toString().trim() : undefined;
        c9 = ws["I1"] ? ws["I1"].v && ws["I1"].v.toString().trim() : undefined;

      if (
        c1 !== "countryname" ||
        c2 !== "locationname" ||
        c3 !== "businessunitname" ||
        c4 !== "workforcename" ||
        !x.includes(c5) ||
        c6 !== "expensetype" ||
        c7 !== "periodicity" ||
        c8 !== "budget") {

        if (c1 !== "username" ||
          c2 !== "department" ||
          c3 !== "designation" ||
          c4 !== "expensetype" ||
          c5 !== "periodicity" ||
          c6 !== "budget") {
          reject("Invalid Budget Template!");
        }
      }
      if (c9 && c9 !== 'minimum_limit_for_attachment' || ( c7 && c1 == 'username' && c7 !== 'minimum_limit_for_attachment')) {
        reject("Invalid Budget Template!");
      }
      
      let is_individual_budget = 0;
      if (c9 === 'minimum_limit_for_attachment' || (c1 == 'username' && c7 == 'minimum_limit_for_attachment')) {
        is_individual_budget = 1;
      }

      if (!data.length)
        reject("Make sure the worksheet named 'data' in the template should not be empty!");

      if (data.length > 1000)
        reject("Maximum 1000 rows can be added at a time!");

      _.each(data, (item, index) => {
        const btype = item['periodicity'];
        const bill_limit = +item['minimum_limit_for_attachment']
        const y = Object.keys(item);
        const level = _.intersectionWith(x, y, _.isEqual).toString();
        item['budgetype'] = btype;

        if (is_individual_budget) item['bill_limit'] = bill_limit;

        if (item.username && item.username.includes('(') && item.username.includes(')')) {

          item['ecode'] = item['username'].split('(')[1].split(')')[0]

          delete item.department;
          delete item.designation;
        }

        if (level == 'username' && !item['ecode']) {
          errusr.push(index + 2)
        }
        
        if (typeof +item.budget !== "number" || +item['budget'] < 0 || +item['budget'] > Number.MAX_SAFE_INTEGER) {
          errb.push(index + 2);
        }
        if (!(['Daily', 'Monthly', 'Quarterly', 'Yearly'].includes(btype))) {
          errbt.push(index + 2);
        }

        if (level !== 'username' && !(item.countryname && item.locationname
          && item.businessunitname && item.workforcename && item.expensetype
          && btype && level && item[level])) {
          errtemp.push(index + 2);

        } else if (!(item.expensetype && btype && level && item[level])) {
          errtemp.push(index + 2);

        }
        
        if (is_individual_budget && bill_limit && (typeof +bill_limit !== "number" || bill_limit < 0 || bill_limit > Number.MAX_SAFE_INTEGER || bill_limit > item['budget'])) {
          errbill.push(index + 2)
        }
        delete item['periodicity'];
        delete item['minimum_limit_for_attachment'];

      });
      let m1 = errb.length ? `Row no. ${errb.toString()} should have correct budget` : '';
      let m2 = errbt.length ? `Row no. ${errbt.toString()} should have correct budget Periodicity` : '';
      let m3 = errtemp.length ? `Row no. ${errtemp.toString()} have some empty fields` : '';
      let m4 = errusr.length ? `Row no. ${errusr.toString()} should have username with their ecode` : '';
      let m5 = errbill.length ? `Row no. ${errbill.toString()} should have correct 'minimum limit for attachment' and it should be less then budget` : '';

      if (errbill.length) {
        reject(m5);
      }
      switch (true) {
        
        case Boolean(m1 && !m2 && !m3 && !m4): reject(m1)
         
        case Boolean(!m1 && m2 && !m3 && !m4): reject(m2)
          
        case Boolean(!m1 && !m2 && m3 && !m4): reject(m3)
          
        case Boolean(!m1 && !m2 && !m3 && m4): reject(m4);
          
        case Boolean(m1 && m2 && !m3 && !m4): reject(`${m1} and ${m2}`)
          
        case Boolean(!m1 && m2 && m3 && !m4): reject(`${m2} and ${m3}`)
          
        case Boolean(!m1 && !m2 && m3 && m4): reject(`${m3} and ${m4}`)
          
        case Boolean(m1 && !m2 && m3 && !m4): reject(`${m1} and ${m3}`)
          
        case Boolean(m1 && !m2 && !m3 && m4): reject(`${m1} and ${m4}`)
          
        case Boolean(!m1 && m2 && !m3 && m4): reject(`${m2} and ${m4}`)
          
        case Boolean(m1 && m2 && m3 || m2 && m3 && m4 || m1 && m3 && m4 || m1 && m2 && m4):
          reject(`Please correct data at row no.  ${_.uniq(_.concat(errb, errbt, errtemp, errusr)).toString()}`)
          
        default:
          resolve(data)
      }
    })
  }
}
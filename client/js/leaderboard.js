console.log(sessionStorage.getItem('name'));

axios.get('http://cloudtype.us-west-2.elasticbeanstalk.com/leaderboard/top10',)
.then(res => {
    let tbody = document.getElementById('insertHere');
    let i = 1;
    res.data.Items.forEach(player => {
        let tr = document.createElement('tr');
        tbody.appendChild(tr);
        Object.keys(player).forEach(key => {
            if (key != 'email' && key != 'status') {
                let td = document.createElement('td');
                td.classList.add("column1");
                td.innerHTML = player[key];
                tr.appendChild(td);
            }
            else if (key === 'status') {
                let td = document.createElement('td');
                td.classList.add("column1");
                td.innerHTML = i;
                tr.appendChild(td);
            }
        })
        i++;
    });
})
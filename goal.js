function ca(n, mod) {
    return  n == mod - 1 ? 0 : n + 1;
}

function cs(n, mod) {
    return n == 0 ? mod - 1 : n - 1;
}

var actor = {
    x: 75,
    xm: 100,
    xl: 1,
    xlm: 3,
    lp: 0,
    c: 0,
    t: 0,
    getStatus: function() {
        return [
            this.x, this.xm, this.xl, this.xlm,
            this.lp, this.c, this.t
        ]
    },
    restore: function(save) {
        var i = 0;
        this.x = save[i++];
        this.xm = save[i++];
        this.xl = save[i++];
        this.xlm = save[i++];
        this.lp = save[i++];
        this.c = save[i++];
        this.t = save[i++];
    },
    overflow: function() {
        while (this.x > this.xm) {
            this.x = Math.floor(this.x / 2);
            this.t += 60;
        }
    },
    underflow: function() {
        if (this.x > 0) return;
        this.t += this.xm / 4 - this.x;
        this.x = this.xm / 4;
    },
    // 0, 1 : 1->2; 0, 1, 2 : 2->3; 0, 1, 2, 3 : 3->4
    evUpgrade: function(x) {
        var s = 100;
        for (var n = 1; n < this.xl; n++)
            s /= 2;
        if (x < s - Math.abs(this.x - actor.xm / 2)) {
            if (this.lp == this.xl) {
                if (this.xl == this.xlm) return true;
                this.lp = 0;
                this.xl++;
                this.xm += 40;
            } else {
                this.lp++;
            }
        }
        this.t += 10;
        return false;
    },
    evGain: function(x) {
        if (x < 75) this.x += 20;
        else this.x += 60;
        this.t += 5;
    },
    evLoss: function(x) {
        if (x < 75) this.x -= 20;
        else this.x -= 60;
        this.t += 5;
    },
    evGainR: function(s, x, a) {
        if (s < x) this.x += Math.floor(a / 3);
    },
    evLossR: function(s, x, a) {
        if (s < x) this.x -= Math.floor(a / 3);
    },
    evRoll: function() {
        this.x -= this.xm * 5 / 100;
    }
}

const timeline = 128;

var cq = {
    data: new Uint8Array(timeline),
    p: 0,
    b: 0,
    rand: function() {
        return Math.floor(100 * Math.random());
    },
    next: function(n = 1) {
        while (n-- > 0) {
            if (this.b > 0) {
                this.p++;
                this.b--;
            }
            else {
                this.data[this.p++] = this.rand();
            }
            if (this.p == timeline) this.p = 0;
        }
    },
    back: function(n = 1) {
        while(n-- > 0 && this.b < timeline / 2) {
            this.p = this.p == 0 ? timeline - 1 : this.p - 1;
            this.b++;
        }
    },
    debug: function(scale) {
        var temp = new Uint8Array(scale);
        var str;
        for (var i = 0; i < scale; i++)
            temp[i] = this.data[(this.p - i - 1 + timeline) % timeline];
        str = temp.toString() + `,<${this.data[this.p]}>,`;
        for (var i = 1; i < scale; i++)
            temp[i] = this.data[(this.p + i) % timeline];
        str += temp.slice(1).toString();
        console.log(str)
    }
}

var ap = 0;
var ab = 0;
var ct = 0;

function pf(p) {
    var fd = [10, 25, 40, 70, 100];
    for (var i = 0; i < fd.length; i++)
        if (p < fd[i]) return i;
}

function fr(p) {
    var fd = [10, 25, 40, 70, 100];
    var rr = [1, 1, 1, 3, 3];
    var i = 0;
    while (p >= fd[i]) i++;
    return rr[i];
}

function predict() {
    var temp = actor.getStatus();
    var evp = cq.data[ap];
    textgererator();
    if (evp < 10) {
        actor.evUpgrade(cq.data[(ap + 1) % timeline]);
        ct = 2;
    } else if (evp >= 10 && evp < 25) {
        actor.evGain(cq.data[(ap + 1) % timeline]);
        ct = 2;
    } else if (evp >= 25 && evp < 40) {
        actor.evLoss(cq.data[(ap + 1) % timeline]);
        ct = 2;
    } else if (evp >= 40 && evp < 70) {
        actor.evGainR(cq.data[(ap + 1) % timeline], cq.data[(ap + 2) % timeline], cq.data[(ap + 3) % timeline]);
        ct = 4;
    } else {
        actor.evLossR(cq.data[(ap + 1) % timeline], cq.data[(ap + 2) % timeline], cq.data[(ap + 3) % timeline]);
        ct = 4;
    }
    setStatus();
    setTimeline();
    var e = document.getElementById("timeline").firstElementChild;
    for (var i = 0; i < 11; i++) {
        if (i > 6 && i < ct + 6)
            e.getAttributeNode("class").value = "future param";
        e = e.nextElementSibling;
    }
    e = null;
    if (temp[0] < actor.x) {
        document.getElementById("x").getAttributeNode("class").value = "gain";
        e = document.getElementById("indicator");
        e.innerHTML = "&uparrow;";
        e.getAttributeNode("class").value = "gain";
    } else if (temp[0] > actor.x) {
        document.getElementById("x").getAttributeNode("class").value = "loss";
        e = document.getElementById("indicator");
        e.innerHTML = "&downarrow;";
        e.getAttributeNode("class").value = "loss";
    }
    if (actor.x < 0) {
        document.getElementById("warning").innerHTML = "underflow!"
    } else if (actor.x > actor.xm) {
        document.getElementById("warning").innerHTML = "overflow!"
    }
    actor.restore(temp);
}

function endPredict() {
    ct = 0;
    setStatus();
    setTimeline();
    document.getElementById("x").getAttributeNode("class").value = "";
    var e = document.getElementById("indicator");
    e.innerHTML = "";
    e.getAttributeNode("class").value = "";
    document.getElementById("warning").innerHTML = ""
    document.getElementById("prediction").firstElementChild.innerHTML = "";
}

function step() {
    var evp = cq.data[ap];
    if (evp < 10) {
        actor.evUpgrade(cq.data[(ap + 1) % timeline]);
        ct = 2;
    } else if (evp >= 10 && evp < 25) {
        actor.evGain(cq.data[(ap + 1) % timeline]);
        ct = 2;
    } else if (evp >= 25 && evp < 40) {
        actor.evLoss(cq.data[(ap + 1) % timeline]);
        ct = 2;
    } else if (evp >= 40 && evp < 70) {
        actor.evGainR(cq.data[(ap + 1) % timeline], cq.data[(ap + 2) % timeline], cq.data[(ap + 3) % timeline]);
        ct = 4;
    } else {
        actor.evLossR(cq.data[(ap + 1) % timeline], cq.data[(ap + 2) % timeline], cq.data[(ap + 3) % timeline]);
        ct = 4;
    }
    cq.next(ct);
    ap = (ap + ct) % timeline;
    ab = Math.min(ab + ct, timeline / 2);
    ct = 0;
    if (actor.x < 0) actor.underflow();
    else if (actor.x > actor.xm) actor.overflow();
    setStatus();
    setTimeline();
    endPredict(); // refresh and
    predict();  // continue until leave
}

function roll() {
    actor.evRoll();
    cq.next();
    ap = ca(ap, timeline)
    ab = ca(ab, timeline);
    setStatus();
    setTimeline();
}

function rollback() {
    actor.x += actor.xm * 5 / 100;
    cq.back();
    ap = cs(ap, timeline)
    ab = cs(ab, timeline);
    setStatus();
    setTimeline();
}

function init() {
    cq.next(5);
    setStatus();
    setTimeline();
}

var elem = {
    x: null,
    xm: null,
    xl: null,
    xlm: null,
    c: null,
    t: null,
    bar: null
    // init: function() {
        
    // }
}

function setStatus() {
    document.getElementById("x").innerHTML = actor.x;
    document.getElementById("xm").innerHTML = actor.xm;
    document.getElementById("amount").innerHTML = actor.xl + "/" + actor.xlm;
    var e = document.getElementById("progress").lastElementChild.firstElementChild.nextElementSibling;
    e.innerHTML = actor.c;
    e.nextElementSibling.nextElementSibling.innerHTML = actor.t + "s";
    document.getElementById("bar").style.marginRight = 215 - Math.floor(actor.lp * 210 / actor.xl) + "px";
}

function setTimeline() {
    var i = Math.min(5, ab);
    var e = document.getElementById("timeline").firstElementChild;
    for (var t = 5, n; t > 0; t--) {
        if (i == t) {
            n = ap - i;
            if (n < 0) n += timeline;
            n = cq.data[n];
            e.innerHTML = n < 10 ? "0" + n : n;
            i--;
        } else
            e.innerHTML = "";
        e = e.nextElementSibling;
    }
    e.innerHTML = ab == 0 ? "&rightarrow;" : "&leftrightarrow;"
    e = e.nextElementSibling;
    for (var t = 0; i < 5; i++) {
        t = ap + i;
        if (t >= timeline) t -= timeline;
        e.innerHTML = cq.data[t] < 10 ? "0" + cq.data[t] : cq.data[t];
        if (i > 0) e.getAttributeNode("class").value = "future";
        e = e.nextElementSibling;
    }
}

function textgererator() {
    var tp = [
        cq.data[ap], cq.data[(ap + 1) % timeline], cq.data[(ap + 2) % timeline], cq.data[(ap + 3) % timeline]
    ]
    var s = 100;
    for (var n = 1; n < actor.xl; n++)
        s /= 2;
    s = Math.max(0, s - Math.abs(actor.x - actor.xm / 2));
    var statments = [
        tp[1] < s
            ? `你的此次升级将会顺利通过。（${s}% | ${tp[1]} < ${s}）`
            : `你的此次升级无法通过……（${100 - s}% | ${s} <= ${tp[1]}）`,
        tp[1] < 75 ? `你将获得20点能量。（75% | ${tp[1]} < 75）` : `你将获得60点能量！（25% | 75 <= ${tp[1]}）`,
        tp[1] < 75 ? `你将失去20点能量。（75% | ${tp[1]} < 75）` : `你将失去60点能量……（25% | 75 <= ${tp[1]}）`,
        tp[1] < tp[2]
            ? `你将获得${Math.floor(tp[3] / 3)}点能量。（50% | ${tp[1]} < ${tp[2]}）`
            : `无事发生……（50% | ${tp[1]} >= ${tp[2]}）`,
        tp[1] < tp[2]
            ? `你将失去${Math.floor(tp[3] / 3)}点能量。（50% | ${tp[1]} < ${tp[2]}）`
            : `无事发生……（50% | ${tp[1]} >= ${tp[2]}）`
    ]
    document.getElementById("prediction").firstElementChild.innerHTML = statments[pf(cq.data[ap])];
}

init();

// (function run(n) {
//     var p = 0;
//     for (var i = 1; i <= n; i++)
//         if (Math.random() < Math.random()) p++;
//     console.log(`p = ${p / n}`);
// })(655360)
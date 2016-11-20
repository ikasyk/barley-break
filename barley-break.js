/**
 * Created by igor on 19.11.16.
 */

function BarleyBreak(container) {
    this.container = container;
    this.moves = 0;
}

BarleyBreak.prototype.create = function(image, size, parts) {
    this.container.classList.add('barley-break-container');
    this.image = image;
    this.parts = parts;

    this.wrap = document.createElement("div");
    this.wrap.classList.add("wrap");
    this.wrap.style.width = this.wrap.style.height = size + parts + 'px';
    this.container.appendChild(this.wrap);

    this.createData(parts);

    var cropSize = this.cropSize = size / parts, self = this;
    for (var i = 0; i < this.data.length; i++) {
        for (var j = 0; j < this.data.length; j++) {
            var crop = this.createCrop(i, j, this.data[i][j]);
            this.wrap.appendChild(crop);
        }
    }

    this.results = document.createElement('div');
    this.results.classList.add('results');
    this.results.innerHTML = '<img src="' + image + '"><div class="moves">0</div>';
    this.container.appendChild(this.results);
    this.movesWrap = this.results.getElementsByClassName('moves')[0];
};

BarleyBreak.prototype.createCrop = function(i, j, index) {
    var crop = document.createElement('div');
    crop.id = "crop-" + index;
    crop.dataset.row = i;
    crop.dataset.column = j;
    crop.classList.add('crop');
    Object.assign(crop.style, {
        width: this.cropSize + 'px',
        height: this.cropSize + 'px',
        top: i * (this.cropSize + 1) + 'px',
        left: j * (this.cropSize + 1) + 'px',
        background: index ? 'url(' + this.image + ') no-repeat' : '',
        backgroundPosition: - (index % this.parts) * this.cropSize + 'px -' + Math.floor(index / this.parts) * this.cropSize + 'px'
    });
    crop.addEventListener('mousedown', BarleyBreak.cropListener(this), false);
    return crop;
};

BarleyBreak.prototype.createData = function(parts) {
    var range = [], i;
    for (i = 0; i < parts * parts; ++i) {
        range.push(i);
    }

    var j, x;
    for (i = range.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = range[i - 1];
        range[i - 1] = range[j];
        range[j] = x;
    }
    // range = [4, 5, 12, 1, 3, 7, 8, 6, 15, 0, 2, 10, 13, 14, 9, 11];
    this.data = [];
    for (i = 0; i < parts; i++) {
        this.data[i] = [];
        for (j = 0; j < parts; j++) {
            this.data[i][j] = range[i * parts + j];
        }
    }
};

BarleyBreak.prototype.checkWin = function() {
    var firstZero = this.data[0][0] == 0 ? 1 : 0;
    var isWin = true;
    for (var i = firstZero; i < this.parts * this.parts + firstZero - 1; i++) {
        console.log(this.data, this.data[Math.floor(i / this.parts)][i % this.parts], i);
        if (this.data[Math.floor(i / this.parts)][i % this.parts] != i)
            isWin = false;
    }
    if (isWin) {
        alert("You win!");
    }
};

Object.assign(BarleyBreak, {
    cropListener: function(self) {
        return function() {
            var zeroCrop = document.getElementById('crop-0');
            var zeroColumn = zeroCrop.dataset.column, zeroRow = zeroCrop.dataset.row;
            var column = this.dataset.column, row = this.dataset.row;
            if ((column == zeroColumn) != (row == zeroRow) && Math.abs(zeroColumn - column) + Math.abs(zeroRow - row) == 1) {
                var zeroCropClone = self.createCrop(row, column, 0);
                var thisCropClone = self.createCrop(zeroRow, zeroColumn, self.data[row][column]);
                self.wrap.replaceChild(thisCropClone, zeroCrop);
                self.wrap.replaceChild(zeroCropClone, this);

                var temp = self.data[zeroRow][zeroColumn];
                self.data[zeroRow][zeroColumn] = self.data[row][column];
                self.data[row][column] = temp;

                self.movesWrap.innerHTML = ++self.moves;
                self.checkWin();
            }
        }
    }
});
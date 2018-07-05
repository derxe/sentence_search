/*
 * Copyright (C) 2016-2017  Alex Yatskov <alex@foosoft.net>
 * Author: Alex Yatskov <alex@foosoft.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function utilAsync(func) {
    return function (...args) {
        return func.apply(this, args);
    };
}

function utilIsolate(data) {
    return JSON.parse(JSON.stringify(data));
}

function utilSetEqual(setA, setB) {
    if (setA.size !== setB.size) {
        return false;
    }

    for (const value of setA) {
        if (!setB.has(value)) {
            return false;
        }
    }

    return true;
}

function utilSetIntersection(setA, setB) {
    return new Set(
        [...setA].filter(value => setB.has(value))
    );
}

function utilSetDifference(setA, setB) {
    return new Set(
        [...setA].filter(value => !setB.has(value))
    );
}

function utilStringHashCode(string) {
    let hashCode = 0;

    for (let i = 0, charCode = string.charCodeAt(i); i < string.length; charCode = string.charCodeAt(++i)) {
        hashCode = ((hashCode << 5) - hashCode) + charCode;
        hashCode |= 0;
    }

    return hashCode;
}
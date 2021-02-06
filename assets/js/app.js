const taskInput = document.querySelector('#task'); //the task input text field

const form = document.querySelector('#task-form'); //The form at the top

const filter = document.querySelector('#filter'); //the task filter text field

const taskList = document.querySelector('.collection'); //The ul

const clearBtn = document.querySelector('.clear-tasks'); //the all task clear button

const reloadBtn = document.querySelector('.fa'); // the reload button

const query = document.querySelector('.collection'); //      I've used querySelector for the .collection

const allLi = query.getElementsByTagName('li'); //I've used by TagName method to identify every collection-item

const asc = document.querySelector('#asc')
const dsc = document.querySelector('#desc')

//Declare DB var
let DB;

// Add Event Listener [on Load]
document.addEventListener('DOMContentLoaded', () => {

    form.addEventListener('submit', addNewTask);
    // Remove task event [event delegation]
    clearBtn.addEventListener('click', clearAllTasks);
    taskList.addEventListener('click', removeTask);
    asc.addEventListener("click", sortAsc)
    dsc.addEventListener("click", sortDsc)
    //DROP DOWN
    $('.dropdown-trigger').dropdown();

    let TasksDB = indexedDB.open("tasks", 1);

    TasksDB.onsuccess = function () {
        DB = TasksDB.result;
        console.log('Database created.');
        console.log(DB);
        displayTaskList();
    }

    TasksDB.onerror = function () {
        console.log('Some Error has happned.');
    }

    TasksDB.onupgradeneeded = function (e) {
        // the event will be the database
        let db = e.target.result;

        // create an object store, 
        // keypath is going to be the Indexes
        let objectStore = db.createObjectStore('tasks', {
            keyPath: 'id',
            autoIncrement: true
        });

        // createindex: 1) field name 2) keypath 3) options
        objectStore.createIndex('taskname', 'taskname', {
            unique: false
        });

        objectStore.createIndex('date', 'date', {
            unique: false
        })

        console.log('Database ready and fields created!');
    }

    function displayTaskList() {
        // clear the previous task list
        while (taskList.firstChild) {
            taskList.removeChild(taskList.firstChild);
        }

        // create the object store
        let objectStore = DB.transaction('tasks').objectStore('tasks');

        objectStore.openCursor().onsuccess = function (e) {
            // assign the current cursor
            let cursor = e.target.result;

            if (cursor) {
                createTaskElement(cursor.value.id, cursor.value.taskname, cursor.value.date)
                cursor.continue();
            }
        }
    }

    function addNewTask(e) {
        e.preventDefault();
        if (taskInput.value === '') {
            taskInput.style.borderColor = 'red';
            return;
        }
        taskInput.style.borderColor = 'green';
        //add to DB
        // create a new object with the form info
        const nowDate = new Date();
        const nowDateString = nowDate.getHours() + ":" + nowDate.getMinutes() + ":" + nowDate.getSeconds() + ":" + nowDate.getMilliseconds()

        let newTask = {
            taskname: taskInput.value,
            date: nowDateString,
        }
        // Insert the object into the database 
        let transaction = DB.transaction(['tasks'], 'readwrite');
        let objectStore = transaction.objectStore('tasks');

        let request = objectStore.add(newTask);
        // on success
        request.onsuccess = () => {
            form.reset();
            displayTaskList();
        }

        transaction.oncomplete = () => {
            console.log('New task added');
        }
        transaction.onerror = () => {
            console.log('There was an error, try again!');
        }

    }

    function createTaskElement(id, task, date) {
        // Create an li element when the user adds a task
        const li = document.createElement("li");
        // Adding a class
        li.className = "collection-item";
        li.setAttribute('data-task-id', id)
        // Create text node and append it
        const p = document.createElement("span")
        p.innerHTML = task
        li.appendChild(p);
        // Create new element for the link
        const link = document.createElement("a");
        // Add class and the x marker for a
        link.className = "delete-item secondary-content";
        link.innerHTML = `<i class="fa fa-remove"></i>  &nbsp; <a href="index.html?id=${id}"><i class="fa fa-edit"></i> </a>`;
        // Append link to li
        li.appendChild(link);
        // Append to UL
        taskList.appendChild(li);
        const addDate = document.createElement("em")
        addDate.className = "align-right"
        addDate.innerHTML = date
        li.appendChild(addDate)
    }

    function removeTask(e) {
        Number(e.target.parentElement.parentElement.getAttribute('data-task-id'));

        if (e.target.parentElement.classList.contains('delete-item')) {
            if (confirm('Are You Sure about that ?')) {
                // get the task id


                let taskID = Number(e.target.parentElement.parentElement.getAttribute('data-task-id'));
                let transaction = DB.transaction(['tasks'], 'readwrite');
                // use a transaction
                let objectStore = DB.transaction('tasks', 'readwrite').objectStore('tasks');
                objectStore.delete(taskID);

                transaction.oncomplete = () => {
                    e.target.parentElement.parentElement.remove();
                }

            }
        }
    }
    //clear tasks 
    function clearAllTasks() {
        if (confirm("Are you sure you want to clear all tasks?")) {
            //Create the transaction and object store
            let transaction = DB.transaction("tasks", "readwrite");
            let tasks = transaction.objectStore("tasks");

            // clear the the table
            tasks.clear();
            //repaint the UI
            displayTaskList();

            console.log("Tasks Cleared !!!");
        }
    }

    function sortAsc() {
        const allContents = new Array()

        let objectStore = DB.transaction('tasks').objectStore('tasks')

        // console.log(objectStore.getAll())
        objectStore.openCursor().onsuccess = function (e) {
            let cursor = e.target.result

            if (cursor) {
                let task = {
                    id: cursor.value.id,
                    taskname: cursor.value.taskname,
                    date: cursor.value.date
                }
                allContents.push(task)
                cursor.continue()
            } else {
                // allContents.forEach(function(t))
                const sortedContent = allContents.sort((a, b) => (a.date > b.date) ? 1 : -1)

                // document.querySelector('.collection').innerHTML = ''
                sortedContent.forEach(function (task) {
                    createTaskElement(task.id, task.taskname, task.date)
                })
            }
        }


    }

    function sortDsc() {

        const allContents = []

        let objectStore = DB.transaction('tasks').objectStore('tasks')

        objectStore.openCursor().onsuccess = function (e) {
            let cursor = e.target.result

            if (cursor) {
                let task = {
                    id: cursor.value.id,
                    taskname: cursor.value.taskname,
                    date: cursor.value.date
                }
                allContents.push(task)
                cursor.continue()
            } else {

                const sortedContent = allContents.reverse((a, b) => (a.date > b.date) ? 1 : -1)

                document.querySelector('.collection').innerHTML = ''
                sortedContent.forEach(function (task) {
                    createTaskElement(task.id, task.taskname, task.date)
                })
            }
        }


    }


    // Reload Page Function
    function reloadPage() {
        //using the reload fun on location object
        location.reload();
    }

    $(".dropdown-trigger").dropdown();

});




// // Define UI Variables 
// const taskInput = document.querySelector('#task'); //the task input text field
// const form = document.querySelector('#task-form'); //The form at the top
// const filter = document.querySelector('#filter'); //the task filter text field
// const taskList = document.querySelector('.collection'); //The UL
// const clearBtn = document.querySelector('.clear-tasks'); //the all task clear button

// const reloadIcon = document.querySelector('.fa'); //the reload button at the top navigation 

// let DB;

// document.addEventListener('submit', addNewTask)

// document.addEventListener('DOMContentLoaded', () => {
//     // create the database
//     let TasksDB = indexedDB.open('tasks', 1);

//     // if there's an error
//     TasksDB.onerror = function () {
//         console.log('There was an error');
//     }
//     // if everything is fine, assign the result to the instance
//     TasksDB.onsuccess = function () {

//         console.log('Database Ready');

//         // save the result
//         DB = TasksDB.result;

//         // display the Task List 
//         displayTaskList();
//     }
//     // This method runs once (great for creating the schema)
//     TasksDB.onupgradeneeded = function (e) {
//         // the event will be the database
//         let db = e.target.result;

//         // create an object store, 
//         // keypath is going to be the Indexes
//         let objectStore = db.createObjectStore('tasks', {
//             keyPath: 'id',
//             autoIncrement: true
//         });

//         // createindex: 1) field name 2) keypath 3) options
//         objectStore.createIndex('taskname', 'taskname', {
//             unique: false
//         });

//         console.log('Database ready and fields created!');
//     }

// })

// //clear button event listener    
// clearBtn.addEventListener('click', clearAllTasks);
// //clear tasks 
// function clearAllTasks() {
//     //Create the transaction and object store
//     let transaction = DB.transaction("tasks", "readwrite");
//     let tasks = transaction.objectStore("tasks");

//     // clear the the table
//     tasks.clear();
//     //repaint the UI
//     displayTaskList();

//     console.log("Tasks Cleared !!!");
// }




// function displayTaskList() {
//     console.log("task list")
// }

// function addNewTask(e) {
//     e.preventDefault();
//     // create a new object with the form info
//     let newTask = {
//         taskname: taskInput.value
//     }
//     // Insert the object into the database 
//     let transaction = DB.transaction(['tasks'], 'readwrite');
//     let objectStore = transaction.objectStore('tasks');

//     let request = objectStore.add(newTask);
//     // on success
//     request.onsuccess = () => {
//         form.reset();
//     }
//     transaction.oncomplete = () => {
//         console.log('New Task added');
//         displayTaskList();
//     }
//     transaction.onerror = () => {
//         console.log('There was an error, try again!');
//     }
// }

// function displayTaskList() {
//     // clear the previous task list
//     while (taskList.firstChild) {
//         taskList.removeChild(taskList.firstChild);
//     }

//     // create the object store
//     let objectStore = DB.transaction('tasks').objectStore('tasks');

//     objectStore.openCursor().onsuccess = function (e) {
//         // assign the current cursor
//         let cursor = e.target.result;

//         if (cursor) {
//             createTaskElement(cursor.value.id, cursor.value.taskname)
//         }
//     }
// }
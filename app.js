let view = {}

let popup = {};
let options;
let newTareaForm;
let btnTareaForm;
let tareaSelected;
let btnSelected;
let sectionList;
let onclick = 'view'; // accion que se hara cuando se haga click en una tarea de la lista de tareas ( ver tarea/seleccionar tarea ). "view", "select"
let action = 'none'; // accion que se hara cuando termine la seleccion de tareas ( terminar/eliminar ). "none", "finish", "delete"
let tareasList;
let tareas = {};

const orderFilter = {
    byDate: 'old-recent',   // old-recent, recent-old
    byState: 'all'          // finished, pending, late, all
}


/***    Local Storage Functions    ***/

const GetTareasFromLocalStorage = () => {
    const tareas = localStorage.getItem('tareas');
    if(tareas){
        console.log('tareas existen!');
        return JSON.parse(tareas);
    }
    console.log('tareas NO existen');
    return {};
}

const SetTareasToLocalStorage = () => {
    localStorage.setItem('tareas', JSON.stringify(tareas));
}


/***    Transitions Functions    ***/

const goToMain = lastElement => {
    hideElements([lastElement]).then( () => showElements([options, sectionList]) );
}
const goToForm = () => {
    hideElements([options, sectionList]).then( () => showElements([newTareaForm]) );
}
const goToTareaView = ( tarea ) => {

    // ponemos la informacion de la tarea
    view["name"].innerHTML = tarea.name;
    view["desc"].innerHTML = tarea.desc;
    view["date"].innerHTML = moment(tarea.date).format("DD/MM/YYYY");
    view["dueDate"].innerHTML = moment(tarea.dueDate).format("DD/MM/YYYY");
    view["state"].classList.remove('pending', 'late', 'finished');
    view["state"].classList.add( getTareaState( tarea ) );
    view["state"].innerHTML = GetStateTextTarea( tarea );

    hideElements([options, sectionList]).then( () => showElements([tareaSelected]) );
}


/***    Animations Functions    ***/

const hideElements = async( elements ) => {
    
    const anim = anime({
        targets: elements,
        scale: [1, 0],
        duration: 1000,
        easing: 'easeInOutExpo',
        begin: () => {
            // elements.classList.remove('hide')
            addHideClass( elements, false );
        },
        complete: () => {
            // elements.classList.add('hide');
            addHideClass( elements );
        }
    });
    //await anim.finished.then();

    return anim.finished.then();
}
const showElements = async( elements ) => {

    const anim = anime({
        targets: elements,
        scale: [0, 1],
        duration: 1000,
        easing: 'easeInOutExpo',
        begin: () => {
            // elements.classList.remove('hide')
            addHideClass( elements, false );
        }
    });
    //await anim.finished.then();

    return anim.finished.then();
}


/***    DOM manipulation functions    ***/

const GetElementsApp = () => {
    view["name"] = document.querySelector('#name');
    view["desc"] = document.querySelector('#desc');
    view["date"] = document.querySelector('#date');
    view["dueDate"] = document.querySelector('#dueDate');
    view["state"] = document.querySelector('#state');

    console.log(view);

    popup["element"] = document.querySelector("#order_popup");
    popup["quit"] = document.querySelector('.quit-btn');
    popup["ok"] = document.querySelector('.pop-up-btn');

    console.log(popup);
    
    options = document.querySelector('#options');
    newTareaForm = document.querySelector('#new-tarea-form');
    btnTareaForm = document.querySelector('#back-button-form');
    tareaSelected = document.querySelector('#tarea-selected');
    btnSelected = document.querySelector('#back-button-tarea-selected');
    sectionList = document.querySelector('#list-tareas');
    tareasList = document.querySelector('#list');
}

const addHideClass = ( elements = [], hide = true ) => {
    if( hide ){
        elements.forEach( element => element.classList.add('hide') );
    }else {
        elements.forEach( element => element.classList.remove('hide') );
    }
}

const GetStateTextTarea = tarea => {
    const state = getTareaState( tarea );
    if( state === 'finished' ) return `Terminado: ${ moment(tarea.finishedDate).format("DD/MM/YYYY") }`;
    if( state === 'pending' ) return `Pendiente`;
    if( state === 'late' ) return `Retrasado`;
}

const UpdateTareaList = list => {
    tareasList.innerHTML = '';
    for (const key in list) {
        // console.log(tareas[key]);
        UpdateTareaElement( list[key] );
    }
}

const UpdateTareaElement = tarea => {
    const state = getTareaState( tarea );
        tareasList.innerHTML += `<li id="${ tarea.id }" class="tarea-preview">
            <div class="container">
                <div class="info-left">
                    <span class="tarea-name">${ setLimitText(tarea.name, 10) }</span>
                    <hr>
                    <span class="bold">Creado</span>
                    <p>${ moment(tarea.date).format("DD/MM/YYYY") }</p>
                </div>
                <div class="info-right">
                    <div class="state list ${ state }">${ GetStateTextTarea( tarea ) }</div>
                    <span class="bold">Desc:</span>
                    <p>${ setLimitText(tarea.desc, 50) }</p>
                </div>
                <div class="img-selected">
                    <img src="assets/icons/selected.png">
                </div>
            </div>
        </li>`;
}

// mostramos u ocultamos los botones cancel o done de la lista de tareas
const ActiveBtns = (active = true) => {
    const btns = document.querySelectorAll('.btnList');
    btns.forEach( btn => {
        if( active ) {
            btn.classList.remove('hide');
        } else {
            btn.classList.add('hide');
        }
    });
}

const OnClickOkPopup = () => {
    // obtenemos los valores de los input radio
    const oDate = ObjToArr( document.getElementsByName('fecha') ).find( fecha => fecha.checked === true );
    const oState = ObjToArr( document.getElementsByName('estado') ).find( estado => estado.checked === true );

    // verificamos sus valores
    if( oDate != null && oState != null) {
        orderFilter.byDate = oDate.value
        orderFilter.byState = oState.value
        console.log( orderFilter );

        // ordenamos los valores
        OrderTareas(orderFilter.byDate, orderFilter.byState);
    }

    // ocultamos el pop up
    hideElements([popup["element"]]);
}

// evento para cuando se haga click en la seccion de lista de tareas
const OnClickSectionListTareas = event => {
    // guardamos el target del evento
    const element = event.target;

    if ( element ) {

        // si el elemento es un boton de lista ( cancel/done )
        if( element.classList.contains('btnList') ) {
            // terminamos la accion ( terminar tarea/eliminar tarea )
            if( element.id === 'done' ) {
                if( action === 'finish' ) finishTareas();
                if( action === 'delete' ) deleteTareas();
            }
            // cancelamos la accion que se iba a realizar
            if( element.id === 'cancel' ) {
                const eSelected = document.querySelectorAll('.tarea-preview.selected');
                eSelected.forEach( e => e.classList.remove('selected'));
            }
            ActiveBtns(false);
            onclick = 'view';
            action = 'none'
            showElements([options]);

        } else {
            // "seleccionamos"/"vista detallada" tarea
            SelectTarea( element );
        }

    }

}

const OrderTareas = ( byDate, byState ) => {
    let tareasOrdered = ObjToArr( tareas );
    // ordenamos la lista de tareas por su fecha de creacion
    tareasOrdered = orderAsc( tareasOrdered );
    if( byDate == 'recent-old') tareasOrdered.reverse();

    // eliminamos tareas dependiendo su estado
    if( byState !== 'all' ) {
        tareasOrdered.forEach( (tarea, index) => {
            if( getTareaState( tarea ) != byState ) delete tareasOrdered[index];
        });
    }

    console.log(tareasOrdered);

    // actualizamos la lista de tareas con las tareas ordenadas
    UpdateTareaList( tareasOrdered );
}

// ordena las tareas de la mas antigua a la mas reciente
const orderAsc = arr => {
    console.log('Arreglo SIN ordenar Ascendentemente', arr);

    let arrToOrder = cloneArr(arr);
    let i, j;
    let min, aux;

    for ( i = 0; i < arrToOrder.length; i++ ) {
        min = i;
        for ( j = i + 1; j < arrToOrder.length; j++ ) {
            const date = moment(arrToOrder[j].date).format("DD/MM/YYYY");
            const dateMin = moment(arrToOrder[min].date).format("DD/MM/YYYY");
            if ( date < dateMin ) {
                min = j;
            }
        }
        aux = arrToOrder[i];
        arrToOrder[i] = arrToOrder[min];
        arrToOrder[min] = aux;
    }

    console.log('Arreglo ordenado Ascendentemente', arrToOrder);
    return arrToOrder;
}

const cloneArr = arr => {
    let clone = [];
    arr.forEach( obj => {
        clone.push( obj );
    });
    return clone
}

const setLimitText = ( text, limit ) => {
    // console.log(text, text.length);

    let newText = '';

    if( text.length > limit ) {
        newText = text.slice(0, limit - 3);
        newText += '...';
        // console.log(newText, newText.length);

        return newText;
    }

    // console.log(newText, newText.length);

    return text;
}

/***    tarea manipulation functions    ***/

const reload = () => {
    localStorage.setItem('tareas', tareas);
    location.reload();
}

const generateId = () => Math.random().toString(36).substr(2, 18);

const stringDateToDateObj = string => {
    const date = string.split('-');
    if( isNaN(date[0]) || isNaN(date[1]) || isNaN(date[2]) ) {
        return 'undefined';
    }
    return {
        year: parseInt(date[0]),
        month: parseInt(date[1]) - 1,
        day: parseInt(date[2])
    }
}

const CreateTarea = (name, desc, dueDate) => {
    //const id = generateId()
    const nuevaTarea = {
        id: generateId(),
        name,
        desc,
        date: new Date(),
        dueDate,
        //state: 'pending',
        finishedDate: 'undefined'
    }
    tareas[nuevaTarea.id] = nuevaTarea;
    SetTareasToLocalStorage();
    console.log(moment(nuevaTarea.date).format("DD/MM/YYYY"), moment(nuevaTarea.dueDate).format("DD/MM/YYYY"));
}

// seleccionamos o vemos una tarea
const SelectTarea = element => {
    // el metodo closest nos devuelve el elemento padre buscado de un hijo
    const tarea = element.closest('.tarea-preview');
    if ( tarea ) {
        if( onclick === 'view' ) goToTareaView( tareas[tarea.id] );
        if( onclick === 'select') tarea.classList.toggle('selected');
    }
}

// creamo una nueva tarea
const SubmitNewTarea = () => {
    const name = document.querySelector('#nombre').value;
    const date = stringDateToDateObj(document.querySelector('#fecha-limite').value);
    const desc = document.querySelector('#descripcion').value;

    if ( name != '' && date != 'undefined' && desc != '' ) {
        const dueDate = new Date(date.year, date.month, date.day);

        CreateTarea( name, desc, dueDate );
        alert( 'Nueva Tarea Creada' );
    } else {
        alert( 'Error al Crear Tarea' );
    }

}

const finishTarea = ( id ) => {
    if ( tareas[id] ) {
        tareas[id].finishedDate = (tareas[id].finishedDate === 'undefined')? new Date():'undefined';
    }
}

const finishTareas = () => {
    const tareasSelected = document.querySelectorAll('.tarea-preview.selected');
    tareasSelected.forEach( tarea => {
        finishTarea( tarea.id );
    });
    SetTareasToLocalStorage();
    UpdateTareaList( tareas );
}

const deleteTarea = ( id ) => {
    if( tareas[id] ) {
        delete tareas[id];
    }
}

const deleteTareas = () => {
    const tareasSelected = document.querySelectorAll('.tarea-preview.selected');
    tareasSelected.forEach( tarea => {
        deleteTarea( tarea.id );
    });
    SetTareasToLocalStorage();
    UpdateTareaList( tareas );
}

const getTareaState = tarea => {
    const date = moment(new Date()).format("DD/MM/YYYY");
    const dueDate = moment(tarea.dueDate).format("DD/MM/YYYY");
    if( tarea.finishedDate == 'undefined') {
        // comparamos si su estado es retrasado o pendiente
        if ( date > dueDate ) return 'late';
        return 'pending';
    }
    return 'finished';
}

const ObjToArr = obj => {
    const arr = [];
    Object.keys( obj ).forEach( key => {
        //const tarea = obj[key];
        arr.push( obj[key] );
    });
    
    return arr;
}

/***    Actions Functions (create tarea, delete tareas, finish tarea, order by)    ***/

const Actions = e => {
    console.log(e.target.id);
    if( e.target.id ){
        switch ( e.target.id ) {
            case 'crearTarea':
                goToForm();
            break;

            case 'terminarTarea':
                hideElements([options])
                    .then( () => {
                        ActiveBtns();
                        onclick = 'select';
                        action = 'finish';
                    });
            break;

            case 'eliminarTarea':
                hideElements([options])
                    .then( () => {
                        ActiveBtns();
                        onclick = 'select';
                        action = 'delete';
                    });
            break;

            case 'ordenarTareas':
                    showElements([popup["element"]]);
                    // orderAsc( GetTareasArr() );
            break;
        }
    }
}


/***    MAIN FUNTION    */

const Main = async() => {
    GetElementsApp();

    tareas = GetTareasFromLocalStorage();
    console.log( tareas );
    UpdateTareaList( tareas );

    // eventos de los botones back del formulario y vista de tarea
    btnTareaForm.addEventListener('click', ()=>{goToMain(newTareaForm)});
    btnSelected.addEventListener('click', ()=>{goToMain(tareaSelected)});

    await showElements([options, sectionList]);

    options.addEventListener('click', Actions );

    sectionList.addEventListener('click', OnClickSectionListTareas );

    newTareaForm.addEventListener('submit', SubmitNewTarea );

    popup["quit"].addEventListener('click', () => hideElements([popup["element"]]) );

    popup["ok"].addEventListener('click', OnClickOkPopup );

}
    

window.onload = function(){
    console.log('document loaded');
    Main();
};


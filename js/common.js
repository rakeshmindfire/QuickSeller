/**
 * Javascript for QuickSeller.com
 *
 * @category   Javascript
 * @package    QuickSeller
 * @author     Rakesh Ranjan Das  <rakesh.das@mindfiresolutions.com>
 * @license    QuickSeller
 * @link       void
 */

/**
 * To validate fields in login form
 *
 * @access public
 * @param void
 * @return boolean 
 */
function validate_form() {
    var return_value = true;
    var msg = '';
    var password_patt = /^\w{6,}$/;
    var email_patt = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var email_error = document.getElementById('email_error');
    var password_error = document.getElementById('password_error');

    if (document.getElementById('email').value === '') {      
        msg += email_error.innerHTML = 'Enter email field.\n';
    
    } else if ( ! document.getElementById('email').value.match(email_patt)) {
        msg += email_error.innerHTML = "Not a valid email address.\n";
    }
 
    if (document.getElementById('pwd').value === '') {
       msg += password_error.innerHTML = "Enter password field.\n"; 
    
    } else if ( ! document.getElementById('pwd').value.match(password_patt)) {
       msg += password_error.innerHTML = "Password must be atleast 6 characters long.\n";
    }

    if(msg !== '') {
        alert(msg);
        return_value = false;
    }
    
    return return_value;
}

/**
 * To show confirmation modal on clicking of delete option
 *
 * @access public
 * @param integer del_id Id of the product to be deleted
 * @return void 
 */
function show_modal(del_id) { 
    $('#myModalDelete').modal('show');    
    $('#confirm_delete').off('click').on('click',function() {
        $.ajax({
            url: 'search.php',
            type: 'post',
            data: { delete_id:del_id },
            success: function() {
                $('#search_button').click(); 
                $('#confirm_message').text('Product deleted successfully!');
                $('#myModalDelete').modal('hide');
            }
        });
    });  
}

/**
 * To show modal of the image when clicked
 *
 * @access public
 * @param void
 * @return void 
 */
function show_image_modal() {
    var img_src = $(this).attr('src');  
    $('#zoomed_image').attr('src',img_src);
    $('#myModalImage').modal('show');
}

/**
 * To change the status of the product 
 *
 * @access public
 * @param integer id Id of the product whose status is to be toggled
 * @return void 
 */
function change_status(id) { 
    $.ajax({
        url: 'search.php',
        type: 'post',
        data: { change_id: id, status: last_status },
        success: function() {
            var obj = {
                            data : {}
                        };
            fetch_products(obj);
        }
    });
}

/**
 * To fetch all products based on provided filter
 *
 * @access public
 * @param object arg Contains parameters for filtering. 
 *       members: {
 *                   integer data.type Type of filtering. 1 for categories,
 *                       2 for ascending sort, 3 for descending sort
 *                   integer data.start Page number to fetch
 *                   boolean data.preserve_page Whether to save the current page number
 *                }
 * @return void 
 */
var last_start = 1;     // Store last page number
var last_status = 1;    // Store last fetch filtered by status (active or inactive)
var last_type = 1;      // Store last fetch filtered by category

function fetch_products(arg) {
    var preserve = arg.data.preserve_page;
    var table_body = '';       
    
    $('#product_list tbody').html('');
    $('#loader_image').removeClass('hide');
    $('#search_category,#status_tab').removeClass('hide');

    // Empty Pagination container on filtering categories
    if( ! preserve) {
        $('#product_pagination').addClass('hide').html('');
    }

    // Store the status during sorting and filtering
    if ( typeof arg.data.status !== 'undefined') {
        last_status = arg.data.status;
    }
    
    // Store the category during sorting, pagination and status change
    if ( typeof arg.data.type !== 'undefined') {
        last_type = arg.data.type;
    }

    // Store the page number during sorting
    if ( typeof arg.data.start !== 'undefined') {
        last_start = arg.data.start;
    }

    var status_arg = arg.data.status || last_status;
    
    // Search for a category
    $.ajax({
        url: 'search.php',
        type: 'post',
        dataType: 'json',
        data: { id : $('#search').val(),
                order_in :  arg.data.type || last_type,
                status: status_arg,
                start_row : arg.data.start || last_start,
                no_of_rows : page_size 
              },
        success: function(res) {
            $('#no_data h2').removeClass('show').addClass('hide');
            $('#products_table').addClass('hide');
            $('#my_products').text('');
            
            if ( ! res.products_exist) {
              $('#search_category,#status_tab').addClass('hide');
              $('#no_data h2').text('No products in this account').removeClass('hide').addClass('show');
            }
            
            else if ( ! res.status) {
                $('#no_data h2').text('No products in this category').removeClass('hide').addClass('show');
            
            } else {
                $('#products_table').removeClass('hide');
                $('#my_products').text('My Products');
                var result = res.result;
                
                for (var i = 0 ; i < result.length ; i++) {
                table_body += '<tr>' +
                    '<td>' + result[i].category_name +'</td>' +
                    '<td><img src="img/product/' + result[i].image + '" class="product-image"></td>' +
                    '<td>' + result[i].product_name + '</td>' +
                    '<td>' + result[i].amount + '</td>' +
                    '<td>' + result[i].description + '</td>' +
                    '<td>' + result[i].created_date + '</td>' +
                    '<td><a onclick=\'window.location="product_register.php?update_id=' + result[i].id + '";\'' +
                           'class="glyphicon glyphicon-pencil color-edit modify-icons"></a>&nbsp;' +
                        '<a class="glyphicon glyphicon-remove color-remove modify-icons" onclick="show_modal('+ result[i].id +')" data-id=' + result[i].id +'></a>' +
                        '<a class="glyphicon modify-icons '+ (status_arg === 1 ? 'glyphicon-minus' : 'glyphicon-ok') +'"' +
                            'onclick="change_status('+ result[i].id +')"></a>' +
                    '</td>' +
                    '</tr>';
                }

                $('#products_table tbody').html(table_body);
                $('#products_table').removeClass('hide');

                $('.product-image').on('click', show_image_modal);
                
                // Modfiy pagination container on filtering category and page entry
                if ( ! preserve) {                    
                    var append_list = '<li class="active"><a>1</a></li>';
                    var no_of_pages = res.total / page_size;

                    if (no_of_pages > 1) {

                        for (var i = 1 ; i < no_of_pages ; i++) {
                            append_list += '<li ><a>'+ (i+1) +'</a></li>';
                        }

                    $('#product_pagination').append(append_list).removeClass('hide');   
                    }
                }
                
                $('#product_pagination li ').off('click')
                    .on('click', 'a', function () {
                        $('#product_pagination li').removeClass('active');
                        $(this).closest('li').addClass('active');                       
                        var obj = {
                            data : { start:$(this).html() ,preserve_page:true }
                        };
                        fetch_products(obj);
                    });              
            }
            $('#loader_image').addClass('hide');
        }
    })
}

/**
 * jQuery function on document ready
 *
 * @access public
 * @param void
 * @return void 
 */
$(document).ready(function() {
    $('#search_button').on('click',{ type: 1, start: 1, preserve_page: false }, fetch_products);
    $('#sorting-arrow-up').on('click', { type: 2, preserve_page: true }, fetch_products);
    $('#sorting-arrow-down').on('click', { type: 3, preserve_page: true }, fetch_products);
    $('#status_tab li ').off('click')
        .on('click', 'a', function () {
            $('#status_tab li').removeClass('active');
            $(this).closest('li').addClass('active');                       
            var obj = {
                data : { status:$(this).data('value') ,start: 1, preserve_page:false }
            };
            fetch_products(obj);
        }); 

    var cur_page = window.location.href;
    $(':reset').on('click',function() {
         window.location = cur_page;
    });  
    
    // List all products in category in product list page
    if (location.pathname.substring(1) === "product_list.php") {
        $.ajax({
        url: 'search.php?get_list=1',
        type: 'get',
        dataType: 'json',
        success: function(res) {
            var options = '';

            options += '<option value="0">All</option>';
            for (var i = 0 ; i < res.length ; i++) {
               options += '<option value=' + res[i].id + '>' + res[i].name + '</option>'; 
            }

            $('#search').append(options);
            $('#search_button').click();
        }
        });
    }
    
    // Manage tabs for permissions.php
    if (location.pathname.substring(1) === "permissions.php") {
         $('#role_tab li ').off('click')
                    .on('click', function () {
                        $('#role_tab li').removeClass('active');
                        $(this).closest('li').addClass('active');   
                        $('table').addClass('hide');
                        $('#table_'+($(this).text()).toLowerCase()).removeClass('hide');                        
                    });   
    }
});
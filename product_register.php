<?php 
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('upload_max_filesize', '2M');
// Include the constant file
require_once 'helper/validation.php';
require_once 'config/constants.php';
require_once 'libraries/db.php';

$msg = '';
$is_update = FALSE;

$db = new dbOperation;

if(isset($_GET['update_id']) ) {
    $is_update = TRUE;
    $db->select('products_list', ['category', 'name', 'amount', 'description', 'image'],['id'=>$_GET['update_id']]);
    $row_to_update = $db->fetch();
} 

if ( ! empty($_POST)) {

    $pic_name = 'product_pic';
    
    // Trim all whitespaces from string values
    $_POST = santizing($_POST);
    $error = validate_data($_POST);     
    $error[$pic_name] = ! empty($_FILES) && $_FILES[$pic_name]['error'] !=4 ? 
        image_validation($pic_name) : ($is_update ? '': 'Product image required.'); 

    $fields_validated = TRUE;
    
    foreach ($error as $error_keys => $error_messages) {
   
        if( ! empty($error_messages)) {
            $fields_validated = FALSE;
            break;
        }
    }
    
    if (empty($error[$pic_name]) && $fields_validated) {
        $data = ['category'=>$_POST['category'], 'user_id'=> '1', 'name'=> $_POST['product_name'],
                    'amount'=>$_POST['product_price'], 'description'=>$_POST['description'] ];
        if(!$is_update) {
            $product_id = $db->insert_or_update(1, 'products_list', $data);
        } else {
            $db->insert_or_update(2,'products_list',$data,['id'=>$_GET['update_id']]);
            $product_id = $_GET['update_id'];
        }
        
        if($is_update && $_FILES[$pic_name]['size'] != 0) {
            $db->select('products_list', ['image'],['id'=>$_GET['update_id']]);
             $img_to_update = $db->fetch();
           
           if( ! is_null($img_to_update['image']) && file_exists(PRODUCT_PIC.$img_to_update['image'])) {
               unlink(PRODUCT_PIC.$img_to_update['image']);
           }
        }

        if( ! empty($_FILES[$pic_name]))
        {

            $extension=(pathinfo(basename($_FILES[$pic_name]['name']))['extension']);
            $file_name = PRODUCT_PIC . $product_id .'_'. time() . '.' . $extension;
            
            if (move_uploaded_file($_FILES[$pic_name]['tmp_name'], $file_name)) {
                
                $db->insert_or_update(2, 'products_list', ['image'=> basename($file_name)], ['id'=>$product_id]);
            }
        }
        $message= $is_update ?  2: 1;
        header("Location: product_list.php?success=$message");  
    }
}
?>

<!DOCTYPE html>
<html lang="en">

    <!--head-->
    <head>
        <title>QuickSeller:<?php echo $is_update? 'Update ': 'Add '; ?> your Product</title>  
        <?php
           require_once 'templates/header.php';     
        ?>
    </head>
    <body >
        <!-- Include the navigation bar -->
        <?php require_once 'templates/navigation.php'; ?>

        <div class='confirmation margin-top120'> </div>
        <section>
            <h3><?php echo $msg; ?></h3>
        <div class="container">
          <h3><?php echo $is_update? 'update ': 'add '; ?>  your product ...</h3>
          <form class="form-horizontal" role="form" method="post" enctype="multipart/form-data" 
                action="product_register.php<?php echo $is_update ? '?update_id='.$_GET['update_id']:''; ?>">

            <div class="form-group">
              <label class="control-label col-sm-2" for="category">Category  <span class="color-remove">*</span></label>           

              <div class="col-sm-4">
                <select class="form-control " id="category" name="category" >  
                    <option value="" >Select Category</option>
                        <?php
                        $db->select('products_category');
                        while($row = $db->fetch()) {                    
                                echo '<option value="'.$row['id'].'" ';
                                echo  ($is_update && $row['id'] === $row_to_update['category'])
                                || (isset($_POST['category']) && $_POST['category'] === $row['id'])
                                    ?'selected ':'';
                                echo    '>'.$row['name'].'</option>';
                            }         
                        ?>
                </select>
              </div>
              <div class="col-sm-4 error-msg"><?php echo isset($error['category']) ? $error['category'] : '';?> </div> 
            </div>

            <div class="form-group">
                <label class="control-label col-sm-2" for="product_name">Product Name <span class="color-remove">*</span></label>
                <div class="col-sm-2">
                    <input type="text" class="form-control" id="product_name" placeholder="Samsung 2360"
                       name="product_name" value="<?php echo  $is_update ? $row_to_update['name']:
                           ((isset($_POST['product_name'])) ? $_POST['product_name']:''); ?>">
                </div>
                <div class="col-sm-4 error-msg"><?php echo isset($error['product_name']) ? $error['product_name'] : '';?> </div> 
            </div>

            <div class="form-group">
                <label class="control-label col-sm-2" for="product_price">Price (INR) <span class="color-remove">*</span></label>
                <div class="col-sm-3">
                    <input type="number" step="0.01" min='0' class="form-control" id="product_price" 
                        placeholder="12324" name="product_price" value=
                        "<?php echo $is_update ? $row_to_update['amount']: 
                            ((isset($_POST['product_price'])) ? $_POST['product_price'] : ''); ?>">
                </div>
                <div class="col-sm-4 error-msg"><?php echo isset($error['product_price']) ? $error['product_price'] : '';?> </div>
            </div>

            <div class="form-group">
                <label class="control-label col-sm-2" >Product Image
                    <?php 
                    echo $is_update?'':'<span class="color-remove">*</span>';
                    ?></label>
                 <div class="col-sm-3">
                    <input type="file" name="product_pic" id="product_pic" />
                </div>
                <div class="col-sm-7 error-msg">  
                <?php if($is_update) { ?>
                       <!-- Trigger the modal with a button -->
                    <button type="button" class="btn btn-info btn-sm" data-toggle="modal" data-target="#myModal">Current Product Image</button>

                    <!-- Modal -->
                    <div id="myModal" class="modal fade" role="dialog">
                      <div class="modal-dialog">

                        <!-- Modal content-->
                        <div class="modal-body" >
                            <img src="<?php 
                            echo empty ( $row_to_update['image']) || !file_exists ( PRODUCT_PIC.$row_to_update['image']) 
                            ? NOIMAGE : PRODUCT_PIC.$row_to_update['image']; ?>" 
                            class="img-thumbnail">
                            <div class="clearfix">
                            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                     </div>
                    </div>
                <?php } echo isset($error['product_pic']) ? $error['product_pic'] : ''; ?>  
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-sm-2" for="description">Description:</label>
                <div class="col-sm-5">
                    <textarea class="form-control" rows="5" id="description" 
                            placeholder="Describe the product..." name="description" ><?php
                            
                            if($is_update) {
                                echo $row_to_update['description'];
                            } else {
                                  echo isset($_POST['description']) ? $_POST['description']:'';
                            }?></textarea>
                </div>
            </div> 

            <div class="form-group">
              <div class="col-sm-offset-2 col-sm-1">
                  <button type="submit" class="btn btn-default btn-lg btn-success">
                      <?php echo $is_update?'Update': 'Add'; ?></button>
              </div>
              <div class="col-sm-offset-1 col-sm-1">
                  <button type="reset" class="btn btn-default btn-lg btn-danger">Clear</button>
              </div>
            </div>
          </form>
        </div>
        </section>   
        
         <?php require_once 'templates/footer.php';?>
    </body>

</html>

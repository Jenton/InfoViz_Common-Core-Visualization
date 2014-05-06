<!DOCTYPE html>
<html <?php language_attributes(); ?> prefix="og: http://ogp.me/ns#">
  <meta charset="<?php bloginfo( 'charset' ); ?>" />
<style type="text/css">

	

</style>
<link rel="stylesheet" href="./_css/style.css" />
<link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />
<script src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
<script src="http://d3js.org/d3.v3.min.js"></script>
<script src="./_js/dndTree.js"></script>
<script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>

<!-- <script src="./_js/script.js"></script> -->
<!-- <script src="./_js/tree.js"></script> -->
<body>
    <div id="filter-column">
      FILTER
      <br />
      <div id="step3-body">
    
                 <label class="modal-label">Subject:</label>
                 <div id="subject-options"><?php 
               $sql = "SELECT a.term_taxonomy_id, c.name FROM  wp_term_taxonomy a, wp_terms c WHERE a.term_id = c.term_id AND taxonomy =  'subject' ORDER BY a.term_taxonomy_id ASC";
             $myrows = $wpdb->get_results($sql);
             foreach ($myrows as $value) {
               echo "<div class='subject-option'><input type='radio' name='subject' class='subject-radio-btn' value='", $value->term_taxonomy_id,"'><div class='subject-option-text'>", $value->name, "</div></div>";
             }
                       ?></div><br>
                 
      <div id="resource-details">
                       <label class="modal-label">Grade:</label>
           <select id="grades" name="grade">
             <option value="9999">Select Grade</option>          
                       </select><br>
          
           <label class="modal-label">Domain:</label>       
           <select id="domains" name="domain">
       <option value="9999">Select Domain</option>  
           </select><br>
                 
           <label class="modal-label">Cluster:</label>
           <select id="clusters" name="cluster">
              <option value="9999">Select Cluster</option>        
           </select><br>
                 
          <label class="modal-label" id="standard-label">Standard: (Optional)</label>
          <select id="standards" name="standard">
             <option value="9999">Select Standard</option>        
           </select><br>
                 </div><!--end resource details-->
           
                   </div><!--end step 3 body-->
      <!-- <div class="subjectFilter"> -->
     <!--  <select id="subjectFilter" name="subjectFilter"> -->
<!--     <option value ="source1.json" selected>English</option>
    <option value ="source2.json">Math</option> -->
    <!-- <option value ="source3.json">Source 3</option> -->
<!-- </select>​ -->
</div>

    </div>
    <div id="tree-container"></div>
    <div id="slider-vertical"></div>
    <div id="standard-hover-div"></div>
</body>
</html>

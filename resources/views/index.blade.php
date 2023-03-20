<html lang="en">
<head>
  <title>Extension App</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
  <!-- jquery datatable -->
<script src="https://code.jquery.com/jquery-1.12.3.js"></script>
<script src="https://cdn.datatables.net/1.10.12/js/jquery.dataTables.min.js" defer></script>
<script src="https://cdn.datatables.net/1.10.12/js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.datatables.net/1.10.12/css/dataTables.bootstrap.min.css">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
</head>
<body>

<div class="container">
  <h2>Browsing History</h2>
              
  <table id="myTable" class="table table-condensed">
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Url</th>
      </tr>
    </thead>
    <tbody>
    <?php 
     if(!empty($historydata[0])){
     foreach($historydata as $val){ ?>    
      <tr>
        <td>{{$val['date']}}</td>
        <td>{{$val['time']}}</td>
        <td>{{$val['url']}}</td>
      </tr>
     <?php }} ?>
    </tbody>
  </table>
</div>
</body>
<script>
$(document).ready( function () {
    $('#myTable').DataTable();
} );
 
</script>
</html>
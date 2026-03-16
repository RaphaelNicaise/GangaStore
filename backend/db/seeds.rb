Category.destroy_all

['Perfumes', 'Notebooks', 'Telefonos', 'Perifericos'].each do |name|
  Category.create!(name: name, description: "Productos de la sección #{name}")
end

puts "      Seeds Finalizados     "
/\*\*

- TO-DO LIST APPLICATION
-
- Đây là một ứng dụng quản lý danh sách việc cần làm đầy đủ,
- bao gồm các tính năng: thêm, sửa, xóa, hoàn thành, lọc, và lưu trữ.
  \*/

import React from 'react';

/\*\*

- Custom Hook: useTodos
-
- Hook này quản lý toàn bộ logic liên quan đến việc cần làm
- bao gồm: thêm, xóa, sửa, và lưu trữ dữ liệu vào localStorage
  \*/
  function useTodos() {
  // State chính chứa danh sách các việc cần làm
  // Mỗi todo có: id, title, description, completed, createdAt
  const [todos, setTodos] = React.useState([]);

// State để quản lý filter hiện tại: 'all', 'completed', 'uncompleted'
const [filter, setFilter] = React.useState('all');

// Khi component mount, tải dữ liệu từ localStorage
// useEffect này chỉ chạy một lần khi component mount
// (dependency array rỗng)
React.useEffect(() => {
// Hàm để tải dữ liệu từ localStorage
const loadTodos = () => {
try {
// Lấy dữ liệu từ localStorage bằng key 'todos'
const savedTodos = localStorage.getItem('todos');

        // Nếu có dữ liệu, parse JSON string thành object
        if (savedTodos) {
          setTodos(JSON.parse(savedTodos));
        }
      } catch (error) {
        // Nếu có lỗi (ví dụ JSON invalid), log error
        console.error('Lỗi khi tải dữ liệu từ localStorage:', error);
      }
    };

    loadTodos();

}, []); // Dependency array rỗng: chỉ chạy một lần khi mount

// Khi danh sách todos thay đổi, lưu nó vào localStorage
// useEffect này chạy mỗi khi `todos` thay đổi
React.useEffect(() => {
try {
// Chuyển danh sách todos thành JSON string
// và lưu vào localStorage bằng key 'todos'
localStorage.setItem('todos', JSON.stringify(todos));
} catch (error) {
// Nếu có lỗi (ví dụ localStorage full), log error
console.error('Lỗi khi lưu dữ liệu vào localStorage:', error);
}
}, [todos]); // Dependency array: chạy mỗi khi todos thay đổi

/\*\*

- Hàm thêm một việc cần làm mới
- @param {string} title - Tiêu đề của việc cần làm
- @param {string} description - Mô tả của việc cần làm (tùy chọn)
  \*/
  const addTodo = (title, description = '') => {
  // Tạo một object mới cho việc cần làm
  const newTodo = {
  // Tạo ID duy nhất bằng timestamp + random number
  // (trong thực tế, nên sử dụng uuid hoặc ID từ server)
  id: Date.now() + Math.random(),
  title: title.trim(),
  description: description.trim(),
  completed: false, // Ban đầu, việc cần làm chưa hoàn thành
  createdAt: new Date().toISOString(), // Lưu thời gian tạo
  };

  // Thêm việc cần làm mới vào đầu danh sách
  // (sử dụng spread operator để tạo một array mới)
  setTodos([newTodo, ...todos]);

};

/\*\*

- Hàm xóa một việc cần làm
- @param {number} id - ID của việc cần làm cần xóa
  \*/
  const deleteTodo = (id) => {
  // Lọc ra các việc cần làm không có ID matching
  // Kết quả là một array mới không chứa việc cần làm bị xóa
  setTodos(todos.filter(todo => todo.id !== id));
  };

/\*\*

- Hàm sửa một việc cần làm
- @param {number} id - ID của việc cần làm cần sửa
- @param {object} updates - Object chứa các thuộc tính cần cập nhật
  \*/
  const editTodo = (id, updates) => {
  // Map qua danh sách todos
  // Nếu ID match, merge các updates vào todo đó
  // Nếu không, trả về todo cũ
  setTodos(todos.map(todo =>
  todo.id === id
  ? { ...todo, ...updates } // Merge updates vào todo
  : todo // Giữ todo cũ
  ));
  };

/\*\*\* Hàm đánh dấu hoàn thành hoặc chưa hoàn thành

- @param {number} id - ID của việc cần làm cần toggle
  \*/
  const toggleTodo = (id) => {
  // Map qua danh sách todos
  // Nếu ID match, toggle trạng thái completed
  setTodos(todos.map(todo =>
  todo.id === id
  ? { ...todo, completed: !todo.completed } // Toggle completed
  : todo
  ));
  };

/\*\*

- Hàm lọc danh sách todos dựa trên filter hiện tại
- @returns {array} Danh sách todos được lọc
  \*/
  const getFilteredTodos = () => {
  switch (filter) {
  case 'completed':
  // Chỉ trả về những việc cần làm đã hoàn thành
  return todos.filter(todo => todo.completed);
  case 'uncompleted':
  // Chỉ trả về những việc cần làm chưa hoàn thành
  return todos.filter(todo => !todo.completed);

      default:
        // Trả về tất cả các việc cần làm
        return todos;

  }
  };

/\*\*

- Hàm để đặt filter
- @param {string} filterType - Loại filter: 'all', 'completed', 'uncompleted'
  \*/
  const setFilterType = (filterType) => {
  setFilter(filterType);
  };

// Trả về tất cả các hàm và state mà các component con cần sử dụng
return {
todos,
filteredTodos: getFilteredTodos(),
filter,
addTodo,
deleteTodo,
editTodo,
toggleTodo,
setFilterType,
};
}

/\*\*

- Component: TodoItem
-
- Hiển thị một việc cần làm riêng lẻ
- Cho phép sửa, xóa, và đánh dấu hoàn thành
  \*/
  function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  // State để quản lý chế độ chỉnh sửa
  const [isEditing, setIsEditing] = React.useState(false);

// State để quản lý tiêu đề đang chỉnh sửa
const [editTitle, setEditTitle] = React.useState(todo.title);

// State để quản lý mô tả đang chỉnh sửa
const [editDescription, setEditDescription] = React.useState(todo.description);

/\*\*

- Hàm xử lý lưu các thay đổi khi sửa
  \*/
  const handleSave = () => {
  // Kiểm tra xem tiêu đề có trống không
  if (editTitle.trim() === '') {
  alert('Tiêu đề không được để trống');
  return;
  }

  // Gọi hàm onEdit để cập nhật todo
  onEdit(todo.id, {
  title: editTitle.trim(),
  description: editDescription.trim(),
  });

  // Thoát khỏi chế độ chỉnh sửa
  setIsEditing(false);

};

// Nếu đang ở chế độ chỉnh sửa, hiển thị form nhập liệu
if (isEditing) {
return (

<div style={{
        padding: '15px',
        border: '2px solid #007bff',
        margin: '10px 0',
        borderRadius: '5px',
        backgroundColor: '#f9f9f9',
      }}>
<div style={{ marginBottom: '10px' }}>
<label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
Tiêu đề:
</label>
<input
type="text"
value={editTitle}
onChange={(e) => setEditTitle(e.target.value)}
placeholder="Tiêu đề việc cần làm"
style={{
              width: '100%',
              padding: '8px',
              borderRadius: '3px',
              border: '1px solid #ccc',
            }}
/>
</div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Mô tả:
          </label>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Mô tả"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '3px',
              border: '1px solid #ccc',
              minHeight: '80px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Lưu
          </button>
          <button
            onClick={() => {
              setEditTitle(todo.title);
              setEditDescription(todo.description);
              setIsEditing(false);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
        </div>
      </div>
    );

}

// Nếu không ở chế độ chỉnh sửa, hiển thị việc cần làm
return (

<div
style={{
        padding: '12px 15px',
        border: '1px solid #e0e0e0',
        margin: '10px 0',
        borderRadius: '5px',
        backgroundColor: todo.completed ? '#f0f0f0' : 'white',
        opacity: todo.completed ? 0.7 : 1,
        transition: 'all 0.3s ease',
      }} >
<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
{/_ Checkbox để đánh dấu hoàn thành _/}
<input
type="checkbox"
checked={todo.completed}
onChange={() => onToggle(todo.id)}
style={{
            marginTop: '3px',
            width: '18px',
            height: '18px',
            cursor: 'pointer',
          }}
/>

        {/* Nội dung việc cần làm */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              textDecoration: todo.completed ? 'line-through' : 'none',
              color: todo.completed ? '#999' : '#333',
            }}
          >
            {todo.title}
          </h3>

          {/* Mô tả nếu có */}
          {todo.description && (
            <p style={{
              margin: '8px 0 0 0',
              color: todo.completed ? '#aaa' : '#666',
              fontSize: '14px',
            }}>
              {todo.description}
            </p>
          )}

          {/* Thời gian tạo */}
          <small style={{
            color: '#999',
            marginTop: '5px',
            display: 'block',
          }}>
            Tạo: {new Date(todo.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </small>
        </div>

        {/* Nút sửa */}
        <button
          onClick={() => setIsEditing(true)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Sửa
        </button>

        {/* Nút xóa */}
        <button
          onClick={() => {
            // Confirm trước khi xóa
            if (window.confirm('Bạn chắc chắn muốn xóa việc này không?')) {
              onDelete(todo.id);
            }
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Xóa
        </button>
      </div>
    </div>

);
}

/\*\*

- Component: TodoList
-
- Hiển thị danh sách các việc cần làm
  \_/
  function TodoList({ todos, onToggle, onDelete, onEdit }) {
  return (
  <div>
  {/_ Nếu danh sách trống, hiển thị thông báo \*/}
  {todos.length === 0 ? (
  <div style={{
            textAlign: 'center',
            padding: '30px',
            color: '#999',
            fontSize: '16px',
          }}>
  <p>Không có việc cần làm nào. Hãy thêm một cái!</p>
  </div>
  ) : (
  // Nếu có việc cần làm, hiển thị danh sách
  <div>
  <p style={{ color: '#666', marginBottom: '15px' }}>
  Tổng cộng: {todos.length} việc
  </p>
  {todos.map(todo => (
  <TodoItem
  key={todo.id} // Key là bắt buộc khi render list
  todo={todo}
  onToggle={onToggle}
  onDelete={onDelete}
  onEdit={onEdit}
  />
  ))}
  </div>
  )}
  </div>
  );
  }

/\*\*

- Component: TodoForm
-
- Form để thêm một việc cần làm mới
  \*/
  function TodoForm({ onAddTodo }) {
  // State để quản lý tiêu đề nhập vào
  const [title, setTitle] = React.useState('');

// State để quản lý mô tả nhập vào
const [description, setDescription] = React.useState('');

/\*\*

- Hàm xử lý submit form
  \*/
  const handleSubmit = (e) => {
  // Ngăn chặn hành động mặc định của form
  e.preventDefault();

  // Kiểm tra xem tiêu đề có trống không
  if (title.trim() === '') {
  alert('Vui lòng nhập tiêu đề của việc cần làm');
  return;
  }

  // Gọi hàm onAddTodo để thêm việc cần làm
  onAddTodo(title, description);

  // Xóa form (reset state)
  setTitle('');
  setDescription('');

};

return (

<form onSubmit={handleSubmit} style={{
      marginBottom: '25px',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '5px',
      border: '1px solid #e0e0e0',
    }}>
<div style={{ marginBottom: '15px' }}>
<label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 'bold',
          color: '#333',
        }}>
Tiêu đề:
</label>
<input
type="text"
value={title}
onChange={(e) => setTitle(e.target.value)}
placeholder="Nhập tiêu đề của việc cần làm"
style={{
            width: '100%',
            padding: '10px',
            borderRadius: '3px',
            border: '1px solid #ccc',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
/>
</div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 'bold',
          color: '#333',
        }}>
          Mô tả (tùy chọn):
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nhập mô tả"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '3px',
            border: '1px solid #ccc',
            minHeight: '100px',
            fontSize: '14px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        type="submit"
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        Thêm việc cần làm
      </button>
    </form>

);
}

/\*\*

- Component: FilterButtons
-
- Nút để lọc danh sách việc cần làm
  \*/
  function FilterButtons({ currentFilter, onFilterChange }) {
  // Định nghĩa các loại filter
  const filters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'uncompleted', label: 'Chưa hoàn thành' },
  { value: 'completed', label: 'Hoàn thành' },
  ];

return (

<div style={{
      marginBottom: '20px',
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    }}>
{filters.map(f => (
<button
key={f.value}
onClick={() => onFilterChange(f.value)}
style={{
            padding: '8px 16px',
            backgroundColor: currentFilter === f.value ? '#007bff' : '#e0e0e0',
            color: currentFilter === f.value ? 'white' : '#333',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: currentFilter === f.value ? 'bold' : 'normal',
            transition: 'all 0.3s ease',
          }} >
{f.label}
</button>
))}
</div>
);
}

/\*\*

- Custom Hook: usePagination
-
- Hook để quản lý pagination của danh sách
  \*/
  function usePagination(items, itemsPerPage = 20) {
  // State để quản lý trang hiện tại
  const [currentPage, setCurrentPage] = React.useState(1);

// Tính toán tổng số trang
const totalPages = Math.ceil(items.length / itemsPerPage);

// Kiểm tra xem currentPage có hợp lệ không
// Nếu currentPage > totalPages, đặt lại về 1
React.useEffect(() => {
if (currentPage > totalPages && totalPages > 0) {
setCurrentPage(1);
}
}, [currentPage, totalPages]);

// Tính toán index bắt đầu và kết thúc cho trang hiện tại
const startIndex = (currentPage - 1) \* itemsPerPage;
const endIndex = startIndex + itemsPerPage;

// Lấy các item cho trang hiện tại
const paginatedItems = items.slice(startIndex, endIndex);

/\*\*

- Hàm chuyển đến trang tiếp theo
  \*/
  const goToNextPage = () => {
  if (currentPage < totalPages) {
  setCurrentPage(currentPage + 1);
  }
  };

/\*\*

- Hàm quay lại trang trước
  \*/
  const goToPreviousPage = () => {
  if (currentPage > 1) {
  setCurrentPage(currentPage - 1);
  }
  };

/\*\*

- Hàm chuyển đến một trang cụ thể
  \*/
  const goToPage = (page) => {
  if (page >= 1 && page <= totalPages) {
  setCurrentPage(page);
  }
  };

// Trả về các giá trị và hàm cần sử dụng
return {
paginatedItems,
currentPage,
totalPages,
goToNextPage,
goToPreviousPage,
goToPage,
};
}

/\*\*

- Component: Pagination
-
- Hiển thị nút phân trang
  \*/
  function Pagination({ currentPage, totalPages, onPageChange }) {
  // Nếu chỉ có một trang hoặc không có trang nào, không hiển thị
  if (totalPages <= 1) {
  return null;
  }

return (

<div style={{
      marginTop: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
    }}>
{/_ Nút trang trước _/}
<button
onClick={() => onPageChange(currentPage - 1)}
disabled={currentPage === 1}
style={{
          padding: '8px 12px',
          backgroundColor: currentPage === 1 ? '#e0e0e0' : '#007bff',
          color: currentPage === 1 ? '#999' : 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.6 : 1,
        }} >
← Trước
</button>

      {/* Thông tin trang */}
      <span style={{
        padding: '8px 12px',
        backgroundColor: '#f0f0f0',
        borderRadius: '3px',
        fontWeight: 'bold',
      }}>
        Trang {currentPage} / {totalPages}
      </span>

      {/* Nút trang tiếp theo */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 12px',
          backgroundColor: currentPage === totalPages ? '#e0e0e0' : '#007bff',
          color: currentPage === totalPages ? '#999' : 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage === totalPages ? 0.6 : 1,
        }}
      >
        Tiếp theo →
      </button>
    </div>

);
}

/\*\*

- Component: App
-
- Component chính của ứng dụng
- Quản lý tất cả các component con và state
  \*/
  function App() {
  // Sử dụng hook useTodos để quản lý todos
  const {
  todos,
  filteredTodos,
  filter,
  addTodo,
  deleteTodo,
  editTodo,
  toggleTodo,
  setFilterType,
  } = useTodos();

// Sử dụng hook usePagination để quản lý pagination
const {
paginatedItems,
currentPage,
totalPages,
goToPage,
} = usePagination(filteredTodos, 20);

// Tính toán thống kê
const completedCount = todos.filter(todo => todo.completed).length;
const uncompletedCount = todos.length - completedCount;

return (

<div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '30px 20px',
      fontFamily: 'Arial, sans-serif',
    }}>
{/_ Header _/}
<header style={{
        marginBottom: '30px',
        borderBottom: '3px solid #007bff',
        paddingBottom: '15px',
      }}>
<h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
📝 Danh sách việc cần làm
</h1>
<p style={{ margin: 0, color: '#666' }}>
Quản lý công việc của bạn một cách hiệu quả
</p>
</header>

      {/* Thống kê */}
      {todos.length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f0f8ff',
          borderRadius: '5px',
          borderLeft: '4px solid #007bff',
        }}>
          <p style={{ margin: 0, color: '#333' }}>
            <strong>Tổng cộng:</strong> {todos.length} |
            <strong style={{ marginLeft: '15px' }}>Hoàn thành:</strong> {completedCount} |
            <strong style={{ marginLeft: '15px' }}>Chưa hoàn thành:</strong> {uncompletedCount}
          </p>
        </div>
      )}

      {/* Form thêm việc cần làm */}
      <TodoForm onAddTodo={addTodo} />

      {/* Nút lọc */}
      {todos.length > 0 && (
        <FilterButtons
          currentFilter={filter}
          onFilterChange={setFilterType}
        />
      )}

      {/* Danh sách việc cần làm */}
      <TodoList
        todos={paginatedItems}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onEdit={editTodo}
      />

      {/* Pagination */}
      {filteredTodos.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
        color: '#999',
        fontSize: '12px',
      }}>
        <p>
          © 2024 To-Do List Application | Dữ liệu được lưu tự động
        </p>
      </footer>
    </div>

);
}

export default App;

```

---

## TÓXM LƯỢC CÁC KIẾN THỨC CHÍNH

### Phần Coding:
- **Lodash.get**: Xử lý nested object access với regex parsing
- **Binary Tree Depth**: Sử dụng recursion vs iteration (DFS, BFS)
- **Island Area**: Dynamic programming + Graph traversal

### Phần System Design:
- **State Management**: Custom hooks (useTodos, usePagination)
- **Component Architecture**: Separation of concerns
- **localStorage**: Persistence layer
- **Performance**: Pagination, memoization, virtualization

### Phần Quiz:
- **JavaScript fundamentals**: Floating-point, scoping, closures
- **React patterns**: Hooks, state management, optimization
- **Event handling**: Event delegation, delegation patterns

### Phần Behavioral:
- **Problem-solving**: Performance optimization story
- **Collaboration**: Working with teams
- **Conflict resolution**: Respectful disagreement
- **Growth mindset**: Learning new technologies
- **Motivation**: Alignment with company values

Tổng cộng, phỏng vấn này cover rất sâu các khía cạnh của Senior Front End Engineer, từ algorithmic thinking đến system design, kiến thức chuyên sâu, và soft skills.
```
